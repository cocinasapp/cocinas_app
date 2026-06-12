import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-verify";

/**
 * PUT /api/ordenes/grupo/[id]
 * Proxies group order edit to the Python backend.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(req);
  if ("response" in auth) return auth.response;

  const { profile } = auth.user;
  if (profile.rol !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { backend_url, ...payload } = body;

  if (!backend_url) {
    return NextResponse.json({ error: "backend_url is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${backend_url}/api/v1/ordenes/grupo/${id}/editar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: text || `HTTP ${res.status}` };
    }

    if (!res.ok) {
      const d = data as Record<string, unknown>;
      return NextResponse.json(
        { error: d?.detail ?? d?.error ?? `Backend respondió con ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Network error";
    return NextResponse.json({ error: `No se pudo conectar al backend: ${message}` }, { status: 502 });
  }
}
