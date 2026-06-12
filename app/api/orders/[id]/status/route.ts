import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-verify";
import { supabaseData } from "@/lib/supabase-server";

const NOTIFY_STATUSES = ["EN_PROCESO", "ENVIADO"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(req);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  const { data, error } = await supabaseData
    .from("tbl_cocina_comandas")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (NOTIFY_STATUSES.includes(status)) {
    const configResult = await supabaseData
      .from("tbl_cocina_config")
      .select("backend_url")
      .eq("user_id", auth.user.adminUserId)
      .single();

    const backendUrl = configResult.data?.backend_url;
    if (backendUrl) {
      fetch(`${backendUrl}/api/v1/notify/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record: data }),
      }).catch(() => {});
    }
  }

  return NextResponse.json(data);
}
