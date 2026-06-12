import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-verify";
import { supabaseData } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("response" in auth) return auth.response;

  const { adminUserId } = auth.user;

  const { data, error } = await supabaseData
    .from("tbl_cocina_tiempos")
    .select("*")
    .eq("user_id", adminUserId)
    .order("orden", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const normalized = (data ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    id: String(t.id),
  }));
  return NextResponse.json(normalized);
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("response" in auth) return auth.response;

  const { adminUserId } = auth.user;
  const body = await req.json();
  const { nombre } = body;

  if (!nombre) {
    return NextResponse.json({ error: "nombre is required" }, { status: 400 });
  }

  // Get max orden
  const { data: existing } = await supabaseData
    .from("tbl_cocina_tiempos")
    .select("orden")
    .eq("user_id", adminUserId)
    .order("orden", { ascending: false })
    .limit(1);

  const maxOrden = existing && existing.length > 0 ? (existing[0].orden ?? 0) : 0;

  const { data, error } = await supabaseData
    .from("tbl_cocina_tiempos")
    .insert({ nombre, user_id: adminUserId, orden: maxOrden + 1, activo: true })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
