export type FacilityType = "tricking" | "parkour" | "mixed";

export type PhotoColor = "ok-lime" | "ok-amber" | "ok-slate";

export interface Photo {
  label: string;
  color: PhotoColor;
}

export interface HourEntry {
  day: string;
  time: string;
  closed?: boolean;
}

export interface Lessons {
  available: boolean;
  types: string[];
  schedule: string;
  price: string;
}

export interface Booking {
  required: boolean;
  walkIn: boolean;
  methods: string[];
  leadTime: string;
}

export interface FacilityLinks {
  web?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
}

// Core fields are always present (real, sourced data). The operational fields
// below are optional — populated only where a facility publishes them.
export interface Facility {
  id: string;
  name: string;
  nameJa: string;
  type: FacilityType;
  typeLabel: string;
  address: string;
  area: string;
  distance: number;
  lat: number;
  lng: number;
  tags: string[];
  description: string;
  photos: Photo[];
  links: FacilityLinks;
  /** Hotlinked og:image from the facility's official site, when available. */
  image?: string;
  /** 施設のオープン日（実在が確認できた施設のみ）。 */
  openedAt?: string;
  /** このアプリへの登録日。 */
  registeredAt: string;
  /** 施設情報の最終更新日。 */
  updatedAt: string;
  rating?: number;
  reviewCount?: number;
  phone?: string;
  hours?: HourEntry[];
  isOpen?: boolean;
  closesAt?: string;
  price?: string;
  priceDay?: string;
  equipment?: string[];
  features?: string[];
  lessons?: Lessons;
  booking?: Booking;
  payment?: string[];
}

export interface EquipmentFilter {
  key: string;
  icon: string;
}

export interface TypeFilter {
  key: "all" | FacilityType;
  label: string;
}

export type SortKey = "distance" | "rating" | "price";
