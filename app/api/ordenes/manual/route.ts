import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-verify";

/**
 * POST /api/ordenes/manual
 * Proxies manual order creation to the Python backend.
 * body includes backend_url (stripped before forwarding).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if ("response" in auth) return auth.response;

    const { profile } = auth.user;
    if (profile.rol !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { backend_url, ...payload } = body;

    console.log("[ordenes/manual] backend_url:", backend_url);
    console.log("[ordenes/manual] payload:", JSON.stringify(payload));

    if (!backend_url) {
      return NextResponse.json({ error: "No hay backend_url configurado en tu Configuración de Cocina" }, { status: 400 });
    }

    const targetUrl = `${backend_url}/api/v1/ordenes/manual`;
    console.log("[ordenes/manual] calling:", targetUrl);

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("[ordenes/manual] response status:", res.status, "body:", text.slice(0, 200));

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: text || `HTTP ${res.status}` };
    }

    if (!res.ok) {
      const d = data as Record<string, unknown>;
      return NextResponse.json(
        { error: d?.detail ?? d?.error ?? `El agente respondió con ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    console.error("[ordenes/manual] unhandled error:", e);
    return NextResponse.json({ error: `Error interno: ${message}` }, { status: 500 });
  }
}
