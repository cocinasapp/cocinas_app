import { NextRequest, NextResponse } from "next/server";
import { supabaseAuthServer, supabaseData } from "@/lib/supabase-server";

/**
 * POST /api/register
 * Called after a successful supabaseAuth.signUp() to insert
 * tbl_clientes + tbl_cocina_config for a new admin user.
 * Requires valid Bearer token (just-created user's session).
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAuthServer.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { nombre_completo, email, telefono, empresa } = body;

  // Insert into tbl_clientes
  const { error: clienteError } = await supabaseData.from("tbl_clientes").insert({
    user_id: user.id,
    nombre_completo,
    email,
    telefono: telefono ?? null,
    empresa: empresa ?? null,
    rol: "admin",
    admin_user_id: null, // admin is their own admin
    activo: true,
  });

  if (clienteError) {
    return NextResponse.json({ error: clienteError.message }, { status: 500 });
  }

  // Insert default tbl_cocina_config
  const { error: configError } = await supabaseData.from("tbl_cocina_config").insert({
    user_id: user.id,
    business_name: empresa ?? "Mi Cocina",
    agent_name: "Lucía",
    precio_menu: 0,
    descuento_por_platillo: false,
    descuento_fijo_omision: 0,
    cobro_desechables: false,
    precio_desechables: 0,
    backend_url: "",
  });

  if (configError) {
    // Non-fatal — config can be set later
    console.error("Warning: could not insert cocina config:", configError.message);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
