import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-verify";
import { supabaseData } from "@/lib/supabase-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const auth = await verifyAuth(req);
  if ("response" in auth) return auth.response;

  const { adminUserId } = auth.user;
  const { phone } = await params;
  const phoneNumber = decodeURIComponent(phone);

  const { data, error } = await supabaseData
    .from("conversations")
    .select("phone_number, message, role, type, created_at, user_id")
    .eq("user_id", adminUserId)
    .eq("phone_number", phoneNumber)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
