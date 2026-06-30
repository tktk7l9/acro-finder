"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import type { Facility } from "@/lib/types";
import { formatDistance } from "@/lib/util";

// Bounding box of Japan's four main islands, used for the default view.
const JAPAN_BOUNDS: L.LatLngBoundsExpression = [
  [30.8, 129.0],
  [45.8, 146.2],
];

interface Props {
  facilities: Facility[];
  activeId: string | null;
  onSelect: (id: string) => void;
  userPos: { lat: number; lng: number };
  showUser: boolean;
  onRecenter?: () => void;
  focusPref?: { lat: number; lng: number } | null;
}

// Zoom level used when recentering on a selected prefecture.
const PREF_ZOOM = 10;

// Numbered facility pin. The number reflects the facility's position in the
// (filtered) list, so it is refreshed whenever that order changes.
function facilityIcon(num: number): L.DivIcon {
  return L.divIcon({
    className: "acro-pin",
    html: `<div class="marker-pin"><span>${num}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

export function InteractiveMap({
  facilities,
  activeId,
  onSelect,
  userPos,
  showUser,
  onRecenter,
  focusPref,
}: Props) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef(new Map<string, { marker: L.Marker; num: number }>());
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);
  const onSelectRef = useRef(onSelect);
  // Keep the marker click handler's callback current without re-binding every
  // marker — the ref is refreshed after each render.
  useEffect(() => {
    onSelectRef.current = onSelect;
  });
  const prevUserPos = useRef<{ lat: number; lng: number } | null>(null);

  // Initialize the Leaflet map once. GSI (地理院) "pale" tiles carry Japanese
  // place names plus prefecture / municipality boundaries; a CSS invert filter
  // (see .gsi-dark) turns the light basemap into a dark one.
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = L.map(mapElRef.current, {
      zoomControl: false,
      minZoom: 4,
      maxZoom: 18,
    }).fitBounds(JAPAN_BOUNDS);
    L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png", {
      className: "gsi-dark",
      maxZoom: 18,
      maxNativeZoom: 18,
      attribution:
        '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">地理院タイル</a>',
    }).addTo(map);

    // Cluster nearby facility markers so dense urban areas stay legible.
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 52,
      disableClusteringAtZoom: 13,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster) =>
        L.divIcon({
          className: "acro-cluster",
          html: `<div class="cluster-pin"><span>${cluster.getChildCount()}</span></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
    });
    clusterGroup.addTo(map);
    clusterRef.current = clusterGroup;
    mapRef.current = map;
    // Pinned to a local so the cleanup uses the same Map instance the effect
    // saw on commit (silences the react-hooks/exhaustive-deps warning).
    const markers = markersRef.current;
    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      // Drop the marker cache so it is rebuilt against the fresh cluster
      // (Strict Mode remounts, and any future map re-init).
      markers.clear();
    };
  }, []);

  // Facility markers — diffed against the previous (filtered) list so only the
  // markers that actually changed are touched. Rebuilding all of them on every
  // keystroke made the cluster recalculation the dominant cost.
  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;
    const store = markersRef.current;
    const nextIds = new Set(facilities.map((f) => f.id));

    // Remove markers no longer in the filtered list.
    const stale: L.Marker[] = [];
    store.forEach((entry, id) => {
      if (!nextIds.has(id)) {
        stale.push(entry.marker);
        store.delete(id);
      }
    });
    if (stale.length) cluster.removeLayers(stale);

    // Add new markers; renumber kept markers whose position shifted.
    const fresh: L.Marker[] = [];
    facilities.forEach((f, i) => {
      const num = i + 1;
      const entry = store.get(f.id);
      if (entry) {
        if (entry.num !== num) {
          entry.marker.setIcon(facilityIcon(num));
          entry.num = num;
        }
        return;
      }
      const marker = L.marker([f.lat, f.lng], { icon: facilityIcon(num) });
      marker.bindTooltip(f.name, {
        direction: "top",
        offset: [0, -34],
        className: "acro-tooltip",
      });
      marker.on("click", () => onSelectRef.current(f.id));
      store.set(f.id, { marker, num });
      fresh.push(marker);
    });
    if (fresh.length) cluster.addLayers(fresh);
  }, [facilities]);

  // Highlight the active marker.
  useEffect(() => {
    markersRef.current.forEach((entry, id) => {
      const active = id === activeId;
      entry.marker.getElement()?.classList.toggle("active", active);
      entry.marker.setZIndexOffset(active ? 1000 : 0);
    });
  }, [activeId, facilities]);

  // User marker + dashed distance line to the active facility.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    userMarkerRef.current?.remove();
    userMarkerRef.current = null;
    lineRef.current?.remove();
    lineRef.current = null;

    if (showUser) {
      userMarkerRef.current = L.marker([userPos.lat, userPos.lng], {
        interactive: false,
        zIndexOffset: 500,
        icon: L.divIcon({
          className: "acro-pin acro-pin-user",
          html: `<div class="marker-pin"><span>◉</span></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        }),
      }).addTo(map);
    }

    const active = activeId ? facilities.find((f) => f.id === activeId) : undefined;
    if (showUser && active) {
      const line = L.polyline(
        [
          [userPos.lat, userPos.lng],
          [active.lat, active.lng],
        ],
        { color: "#cee85b", weight: 2, dashArray: "5 6", opacity: 0.7, interactive: false },
      ).addTo(map);
      line.bindTooltip(formatDistance(active.distance), {
        permanent: true,
        direction: "center",
        className: "acro-dist",
      });
      lineRef.current = line;
    }
  }, [showUser, userPos, activeId, facilities]);

  // Fly to the user only when the position actually changes (i.e. a real
  // geolocation result) — not on the initial mount or Strict Mode re-runs.
  useEffect(() => {
    const prev = prevUserPos.current;
    prevUserPos.current = userPos;
    if (!prev || (prev.lat === userPos.lat && prev.lng === userPos.lng)) return;
    mapRef.current?.flyTo([userPos.lat, userPos.lng], 12, { duration: 1.2 });
  }, [userPos]);

  // Recenter the map on the selected prefecture.
  useEffect(() => {
    if (focusPref) {
      mapRef.current?.flyTo([focusPref.lat, focusPref.lng], PREF_ZOOM, { duration: 1.2 });
    }
  }, [focusPref]);

  const handleRecenter = () => {
    mapRef.current?.fitBounds(JAPAN_BOUNDS);
    onRecenter?.();
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      <div ref={mapElRef} style={{ position: "absolute", inset: 0 }} />
      <div className="map-controls">
        <button
          className="map-ctrl-btn"
          title="拡大"
          onClick={() => mapRef.current?.zoomIn()}
        >
          ＋
        </button>
        <button
          className="map-ctrl-btn"
          title="縮小"
          onClick={() => mapRef.current?.zoomOut()}
        >
          −
        </button>
        <button className="map-ctrl-btn" title="日本全体を表示" onClick={handleRecenter}>
          ◎
        </button>
      </div>
    </div>
  );
}
