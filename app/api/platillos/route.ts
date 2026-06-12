import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-verify";
import { supabaseData } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("response" in auth) return auth.response;

  const { adminUserId } = auth.user;

  const { data, error } = await supabaseData
    .from("tbl_cocina_platillos")
    .select("*")
    .eq("user_id", adminUserId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const normalized = (data ?? []).map((p: Record<string, unknown>) => ({
    ...p,
    id: String(p.id),
    tiempo_id: String(p.tiempo_id),
  }));
  return NextResponse.json(normalized);
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("response" in auth) return auth.response;

  const { adminUserId } = auth.user;
  const body = await req.json();
  const { platillo, precio, tiempo_id } = body;

  if (!platillo || precio == null || !tiempo_id) {
    return NextResponse.json(
      { error: "platillo, precio and tiempo_id are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseData
    .from("tbl_cocina_platillos")
    .insert({ platillo, precio, tiempo_id, user_id: adminUserId, activo: true })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
