import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-verify";
import { supabaseData } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("response" in auth) return auth.response;

  const { adminUserId } = auth.user;

  // Today's date range in Mexico City time (UTC-6)
  // midnight CDMX = 06:00 UTC, next midnight CDMX = next day 06:00 UTC
  const CDMX_OFFSET_MS = 6 * 60 * 60 * 1000;
  const nowCdmx = new Date(Date.now() - CDMX_OFFSET_MS);
  const y = nowCdmx.getUTCFullYear(), m = nowCdmx.getUTCMonth(), d = nowCdmx.getUTCDate();
  const startOfDay = new Date(Date.UTC(y, m, d, 6, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(y, m, d + 1, 6, 0, 0, 0) - 1);

  const { data, error } = await supabaseData
    .from("tbl_cocina_comandas")
    .select(
      "id, cliente_nombre, monto_total, status, tipo_entrega, direccion, pedido_grupo, es_extra, created_at"
    )
    .eq("user_id", adminUserId)
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
