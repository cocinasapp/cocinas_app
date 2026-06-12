import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-verify";
import { supabaseData } from "@/lib/supabase-server";

/**
 * POST /api/orders/group-status
 * Checks if all orders in a pedido_grupo are TERMINADO.
 * If yes, updates all of them to LISTO_COCINA.
 */
export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("response" in auth) return auth.response;

  const { adminUserId } = auth.user;
  const body = await req.json();
  const { pedido_grupo } = body;

  if (!pedido_grupo) {
    return NextResponse.json({ updated: false, error: "pedido_grupo required" }, { status: 400 });
  }

  // Get all orders in the group
  const { data: groupOrders, error: fetchError } = await supabaseData
    .from("tbl_cocina_comandas")
    .select("id, status")
    .eq("pedido_grupo", pedido_grupo)
    .eq("user_id", adminUserId);

  if (fetchError || !groupOrders) {
    return NextResponse.json({ error: fetchError?.message ?? "Error fetching group" }, { status: 500 });
  }

  if (groupOrders.length <= 1) {
    return NextResponse.json({ updated: false });
  }

  // Check if all are TERMINADO
  const allTerminado = groupOrders.every((o) => o.status === "TERMINADO");

  if (!allTerminado) {
    return NextResponse.json({ updated: false });
  }

  // Promote all to LISTO_COCINA
  const ids = groupOrders.map((o) => o.id);
  const { error: updateError } = await supabaseData
    .from("tbl_cocina_comandas")
    .update({ status: "LISTO_COCINA" })
    .in("id", ids);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ updated: true, count: ids.length });
}
