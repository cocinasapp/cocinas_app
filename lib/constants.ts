import type { OrderStatus } from "./types";

export const BRAND_ORANGE = "#ff7a00";
export const BRAND_ORANGE_DARK = "#ff5e00";

export const STATUS_OPTIONS: OrderStatus[] = [
  "PENDIENTE",
  "EN_PROCESO",
  "TERMINADO",
  "LISTO_COCINA",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
];

// Maps status → Radix color token
export const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDIENTE: "orange",
  EN_PROCESO: "blue",
  TERMINADO: "green",
  LISTO_COCINA: "purple",
  ENVIADO: "cyan",
  ENTREGADO: "green",
  CANCELADO: "red",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En Proceso",
  TERMINADO: "Terminado",
  LISTO_COCINA: "Listo Cocina",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

// Cycle for group coloring
export const GROUP_COLORS = [
  "orange",
  "violet",
  "cyan",
  "pink",
  "teal",
  "amber",
] as const;

export type GroupColor = (typeof GROUP_COLORS)[number];

export const LOCAL_STORAGE_TOKEN_KEY = "cocinas_access_token";
