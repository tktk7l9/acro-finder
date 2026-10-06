import { MapApp } from "@/components/MapApp";
import { EVENTS } from "@/lib/events-data";

export default function HomePage() {
  return <MapApp eventCount={EVENTS.length} />;
}
