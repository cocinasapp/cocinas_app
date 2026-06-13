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

  // TERMINADO = done and visible; LISTO_COCINA = done but hidden (waiting for group)
  const DONE = ["TERMINADO", "LISTO_COCINA"];
  const allDone = groupOrders.every((o) => DONE.includes(o.status));

  if (allDone) {
    // All done → promote every comanda to visible TERMINADO
    const ids = groupOrders.map((o) => o.id);
    const { error } = await supabaseData
      .from("tbl_cocina_comandas")
      .update({ status: "TERMINADO" })
      .in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ updated: true, all_complete: true });
  }

  // Group incomplete → hide this comanda until the rest finish
  const { comanda_id } = body;
  if (comanda_id) {
    await supabaseData
      .from("tbl_cocina_comandas")
      .update({ status: "LISTO_COCINA" })
      .eq("id", comanda_id);
  }

  return NextResponse.json({ updated: true, all_complete: false });
}
