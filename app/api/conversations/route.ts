import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-verify";
import { supabaseData } from "@/lib/supabase-server";

function getDateRange(filter: string): { start: Date; end: Date } {
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  switch (filter) {
    case "ayer": {
      const start = new Date(todayStart);
      start.setUTCDate(start.getUTCDate() - 1);
      const end = new Date(todayStart);
      end.setUTCMilliseconds(-1);
      return { start, end };
    }
    case "semana": {
      const start = new Date(todayStart);
      start.setUTCDate(start.getUTCDate() - 7);
      return { start, end: new Date() };
    }
    case "mes": {
      const start = new Date(todayStart);
      start.setUTCDate(start.getUTCDate() - 30);
      return { start, end: new Date() };
    }
    case "hoy":
    default: {
      return { start: todayStart, end: new Date() };
    }
  }
}

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("response" in auth) return auth.response;

  const { adminUserId } = auth.user;
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") ?? "hoy";

  const { start, end } = getDateRange(filter);

  const { data, error } = await supabaseData
    .from("conversations")
    .select("phone_number, message, created_at")
    .eq("user_id", adminUserId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by phone_number
  const contactMap = new Map<
    string,
    { last_message: string; last_message_at: string; message_count: number }
  >();

  for (const row of data ?? []) {
    const existing = contactMap.get(row.phone_number);
    if (!existing) {
      contactMap.set(row.phone_number, {
        last_message: row.message,
        last_message_at: row.created_at,
        message_count: 1,
      });
    } else {
      existing.message_count += 1;
      // Keep most recent
      if (row.created_at > existing.last_message_at) {
        existing.last_message = row.message;
        existing.last_message_at = row.created_at;
      }
    }
  }

  const contacts = Array.from(contactMap.entries())
    .map(([phone_number, info]) => ({ phone_number, ...info }))
    .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));

  return NextResponse.json(contacts);
}
