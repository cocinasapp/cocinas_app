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

  // Get desglose items joined with platillos and their tiempo (nested join)
  const { data, error } = await supabaseData
    .from("tbl_cocina_desglose")
    .select(
      `
      comanda_id,
      platillo_id,
      tbl_cocina_platillos (
        platillo,
        precio,
        tiempo_id,
        tbl_cocina_tiempos (
          id,
          nombre,
          orden
        )
      )
    `
    )
    .eq("comanda_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten the join result
  const items = (data ?? []).map((row: Record<string, unknown>) => {
    const platilloData = row.tbl_cocina_platillos as {
      platillo?: string;
      precio?: number;
      tiempo_id?: number;
      tbl_cocina_tiempos?: { id?: number; nombre?: string; orden?: number } | null;
    } | null;
    const tiempoData = platilloData?.tbl_cocina_tiempos ?? null;

    return {
      comanda_id: row.comanda_id,
      platillo_id: row.platillo_id,
      platillo: platilloData?.platillo ?? null,
      precio: platilloData?.precio ?? null,
      tiempo_id: tiempoData?.id ?? platilloData?.tiempo_id ?? null,
      tiempo_nombre: tiempoData?.nombre ?? null,
      tiempo_orden: tiempoData?.orden ?? null,
    };
  });

  return NextResponse.json(items);
}

