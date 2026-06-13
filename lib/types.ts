// ─── Auth & User ─────────────────────────────────────────────────────────────

export type UserRole = "admin" | "cocina" | "mesero" | "repartidor";

export interface UserProfile {
  user_id: string;
  nombre_completo: string;
  email: string;
  telefono?: string;
  empresa?: string;
  rol: UserRole;
  admin_user_id: string | null;
  activo: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile;
  adminUserId: string;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "PENDIENTE"
  | "EN_PROCESO"
  | "TERMINADO"
  | "LISTO_COCINA"
  | "ENVIADO"
  | "ENTREGADO"
  | "CANCELADO";

export type TipoEntrega = "local" | "domicilio";

export interface Comanda {
  id: string;
  user_id: string;
  cliente_nombre: string;
  monto_total: number;
  status: OrderStatus;
  tipo_entrega: TipoEntrega;
  direccion?: string;
  pedido_grupo?: string;
  es_extra?: boolean;
  created_at: string;
}

export interface ComandaDesglose {
  comanda_id: string;
  platillo_id: string;
  platillo?: string;
  precio?: number;
}

// ─── Kitchen Config ───────────────────────────────────────────────────────────

export interface CocinaConfig {
  user_id: string;
  business_name: string;
  agent_name: string;
  precio_menu: number;
  descuento_por_platillo: boolean;
  descuento_fijo_omision: number;
  cobro_desechables: boolean;
  precio_desechables: number;
  backend_url: string;
}

export interface Tiempo {
  id: string;
  user_id: string;
  nombre: string;
  orden: number;
  activo: boolean;
}

export interface Platillo {
  id: string;
  user_id: string;
  platillo: string;
  precio: number;
  tiempo_id: string;
  activo: boolean;
  created_at: string;
  stock?: number | null;
}

// ─── Conversations ────────────────────────────────────────────────────────────

export type MessageRole = "assistant" | "user";
export type MessageType = "text" | "audio" | "image";

export interface Message {
  phone_number: string;
  message: string;
  role: MessageRole;
  type: MessageType;
  created_at: string;
  user_id: string;
}

export interface Contact {
  phone_number: string;
  last_message: string;
  last_message_at: string;
  message_count: number;
}

// ─── Manual Order ─────────────────────────────────────────────────────────────

export interface PlatilloSeleccionado {
  platillo_id: string;
  platillo_nombre: string;
  precio: number;
}

export interface ComidaItem {
  platillos: PlatilloSeleccionado[];
}

export interface ManualOrderPayload {
  cliente_nombre: string;
  tipo_entrega: TipoEntrega;
  direccion: string;
  comidas: ComidaItem[];
  extras: PlatilloSeleccionado[];
  precio_menu: number;
  descuento_por_platillo: boolean;
}

export interface EditOrderPayload {
  comandas: {
    comanda_id: string;
    platillos: PlatilloSeleccionado[];
  }[];
  precio_menu: number;
  descuento_por_platillo: boolean;
}

// ─── Sub-user creation ────────────────────────────────────────────────────────

export interface CreateUserPayload {
  email: string;
  password: string;
  nombre_completo: string;
  telefono?: string;
  rol: UserRole;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}
