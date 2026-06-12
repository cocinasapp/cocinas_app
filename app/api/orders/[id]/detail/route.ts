import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-verify";
import { supabaseData } from "@/lib/supabase-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(req);
  if ("response" in auth) return auth.response;

  const { id } = await params;

  // Get desglose items joined with platillos
  const { data, error } = await supabaseData
    .from("tbl_cocina_desglose")
    .select(
      `
      comanda_id,
      platillo_id,
      tbl_cocina_platillos (
        platillo,
        precio
      )
    `
    )
    .eq("comanda_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten the join result
  const items = (data ?? []).map((row: Record<string, unknown>) => {
    const platilloData = row.tbl_cocina_platillos as { platillo?: string; precio?: number } | null;
    return {
      comanda_id: row.comanda_id,
      platillo_id: row.platillo_id,
      platillo: platilloData?.platillo ?? null,
      precio: platilloData?.precio ?? null,
    };
  });

  return NextResponse.json(items);
}
