import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-verify";
import { supabaseAuthServer, supabaseData } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("response" in auth) return auth.response;

  const { userId, profile } = auth.user;

  if (profile.rol !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseData
    .from("tbl_clientes")
    .select("*")
    .eq("admin_user_id", userId)
    .order("nombre_completo");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("response" in auth) return auth.response;

  const { userId, profile } = auth.user;

  if (profile.rol !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { email, password, nombre_completo, telefono, rol } = body;

  if (!email || !password || !nombre_completo || !rol) {
    return NextResponse.json(
      { error: "email, password, nombre_completo and rol are required" },
      { status: 400 }
    );
  }

  // 1. Create auth user using service role
  const { data: authData, error: authError } =
    await supabaseAuthServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Could not create auth user" },
      { status: 500 }
    );
  }

  const newUserId = authData.user.id;

  // 2. Insert into tbl_clientes
  const { data: profileData, error: profileError } = await supabaseData
    .from("tbl_clientes")
    .insert({
      user_id: newUserId,
      nombre_completo,
      email,
      telefono: telefono ?? null,
      empresa: profile.empresa ?? null,
      rol,
      admin_user_id: userId,
      activo: true,
    })
    .select()
    .single();

  if (profileError) {
    // Attempt cleanup of auth user
    await supabaseAuthServer.auth.admin.deleteUser(newUserId);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json(profileData, { status: 201 });
}
