import { LOCAL_STORAGE_TOKEN_KEY } from "./constants";
import type {
  Comanda,
  CocinaConfig,
  Tiempo,
  Platillo,
  UserProfile,
  Contact,
  Message,
  ManualOrderPayload,
  EditOrderPayload,
  CreateUserPayload,
  ComandaDesglose,
} from "./types";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers ?? {}),
  };

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function fetchOrders(): Promise<Comanda[]> {
  return apiFetch<Comanda[]>("/api/orders");
}

export async function patchOrderStatus(
  id: string,
  status: string
): Promise<Comanda> {
  return apiFetch<Comanda>(`/api/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchOrderDetail(id: string): Promise<ComandaDesglose[]> {
  return apiFetch<ComandaDesglose[]>(`/api/orders/${id}/detail`);
}

export async function checkAndUpdateGroupStatus(
  pedido_grupo: string,
  comanda_id: string
): Promise<{ updated: boolean }> {
  return apiFetch<{ updated: boolean }>("/api/orders/group-status", {
    method: "POST",
    body: JSON.stringify({ pedido_grupo, comanda_id }),
  });
}

// ─── Config ───────────────────────────────────────────────────────────────────

export async function fetchConfig(): Promise<CocinaConfig> {
  return apiFetch<CocinaConfig>("/api/config");
}

export async function saveConfig(config: Partial<CocinaConfig>): Promise<CocinaConfig> {
  return apiFetch<CocinaConfig>("/api/config", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

// ─── Tiempos ─────────────────────────────────────────────────────────────────

export async function fetchTiempos(): Promise<Tiempo[]> {
  return apiFetch<Tiempo[]>("/api/tiempos");
}

export async function createTiempo(nombre: string): Promise<Tiempo> {
  return apiFetch<Tiempo>("/api/tiempos", {
    method: "POST",
    body: JSON.stringify({ nombre }),
  });
}

export async function toggleTiempo(id: string, activo: boolean): Promise<Tiempo> {
  return apiFetch<Tiempo>(`/api/tiempos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ activo }),
  });
}

// ─── Platillos ────────────────────────────────────────────────────────────────

export async function fetchPlatillos(): Promise<Platillo[]> {
  return apiFetch<Platillo[]>("/api/platillos");
}

export async function createPlatillo(
  data: Pick<Platillo, "platillo" | "precio" | "tiempo_id">
): Promise<Platillo> {
  return apiFetch<Platillo>("/api/platillos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function togglePlatillo(id: string, activo: boolean): Promise<Platillo> {
  return apiFetch<Platillo>(`/api/platillos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ activo }),
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function fetchUsuarios(): Promise<UserProfile[]> {
  return apiFetch<UserProfile[]>("/api/usuarios");
}

export async function createUsuario(data: CreateUserPayload): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/usuarios", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function fetchContacts(filter: string): Promise<Contact[]> {
  return apiFetch<Contact[]>(`/api/conversations?filter=${filter}`);
}

export async function fetchMessages(phone: string): Promise<Message[]> {
  return apiFetch<Message[]>(`/api/messages/${encodeURIComponent(phone)}`);
}

// ─── Manual Orders ────────────────────────────────────────────────────────────

export async function createManualOrder(
  payload: ManualOrderPayload,
  backendUrl: string
): Promise<unknown> {
  return apiFetch<unknown>("/api/ordenes/manual", {
    method: "POST",
    body: JSON.stringify({ ...payload, backend_url: backendUrl }),
  });
}

export async function editGroupOrder(
  grupoId: string,
  payload: EditOrderPayload,
  backendUrl: string
): Promise<unknown> {
  return apiFetch<unknown>(`/api/ordenes/grupo/${grupoId}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, backend_url: backendUrl }),
  });
}

export async function fetchOrderDetail(id: string): Promise<ComandaDesglose[]> {
  return apiFetch<ComandaDesglose[]>(`/api/orders/${id}/detail`);
}
