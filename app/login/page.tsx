"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Flex,
  Text,
  TextField,
  Spinner,
  Tabs,
} from "@radix-ui/themes";
import { ChefHat, Eye, EyeOff } from "lucide-react";
import { supabaseAuth } from "@/lib/supabase-client";
import { useAuth } from "@/contexts/AuthContext";
import { BRAND_ORANGE, LOCAL_STORAGE_TOKEN_KEY } from "@/lib/constants";

type View = "login" | "register" | "forgot";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<View>("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regNombre, setRegNombre] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [regEmpresa, setRegEmpresa] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const role = user.profile.rol;
      const destinations: Record<string, string> = {
        admin: "/admin",
        cocina: "/cocina",
        mesero: "/mesero",
        repartidor: "/repartidor",
      };
      router.replace(destinations[role] ?? "/admin");
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const { role } = await login(loginEmail, loginPassword);
      const destinations: Record<string, string> = {
        admin: "/admin",
        cocina: "/cocina",
        mesero: "/mesero",
        repartidor: "/repartidor",
      };
      router.push(destinations[role] ?? "/admin");
    } catch (e: unknown) {
      setLoginError(e instanceof Error ? e.message : "Error al iniciar sesión");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regEmail || !regPassword || !regNombre || !regEmpresa) {
      setRegError("Todos los campos marcados * son requeridos");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setRegLoading(true);
    try {
      const { data, error } = await supabaseAuth.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            nombre_completo: regNombre,
            telefono: regTelefono,
            empresa: regEmpresa,
          },
        },
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("No se pudo crear el usuario");

      // Auto-login to get token, then call register API
      const { data: loginData, error: loginError } =
        await supabaseAuth.auth.signInWithPassword({
          email: regEmail,
          password: regPassword,
        });

      if (loginError || !loginData.session) {
        // User created but email confirmation required
        setRegSuccess(true);
        return;
      }

      const token = loginData.session.access_token;
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, token);

      // Create tbl_clientes + tbl_cocina_config via API
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: data.user.id,
          nombre_completo: regNombre,
          email: regEmail,
          telefono: regTelefono,
          empresa: regEmpresa,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Error al registrar perfil");
      }

      setRegSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch (e: unknown) {
      setRegError(e instanceof Error ? e.message : "Error al registrarse");
    } finally {
      setRegLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail) {
      setForgotError("Ingresa tu email");
      return;
    }
    setForgotLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabaseAuth.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${origin}/reset-password`,
      });
      if (error) throw new Error(error.message);
      setForgotSuccess(true);
    } catch (e: unknown) {
      setForgotError(e instanceof Error ? e.message : "Error al enviar email");
    } finally {
      setForgotLoading(false);
    }
  };

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
        <Spinner size="3" />
      </Flex>
    );
  }

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #fffdfa 0%, #fff5e6 100%)",
        padding: 24,
      }}
    >
      <Box style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <Flex direction="column" align="center" mb="6" gap="2">
          <Flex
            align="center"
            justify="center"
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#fff5e6",
              border: "2px solid #ffe0b2",
            }}
          >
            <ChefHat size={32} color={BRAND_ORANGE} />
          </Flex>
          <Text size="6" weight="bold" style={{ color: BRAND_ORANGE }}>
            Cocinas App
          </Text>
          <Text size="2" color="gray">
            Sistema de gestión de pedidos
          </Text>
        </Flex>

        {/* Card */}
        <Box className="auth-card">
          <Tabs.Root
            value={view}
            onValueChange={(v) => {
              setView(v as View);
              setLoginError(null);
              setRegError(null);
              setForgotError(null);
            }}
          >
            <Tabs.List mb="5">
              <Tabs.Trigger value="login">Iniciar Sesión</Tabs.Trigger>
              <Tabs.Trigger value="register">Registrarse</Tabs.Trigger>
              <Tabs.Trigger value="forgot">¿Olvidaste?</Tabs.Trigger>
            </Tabs.List>

            {/* LOGIN */}
            <Tabs.Content value="login">
              <form onSubmit={handleLogin}>
                <Flex direction="column" gap="3">
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">Email</Text>
                    <TextField.Root
                      type="email"
                      placeholder="tu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </Flex>

                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">Contraseña</Text>
                    <TextField.Root
                      type={showPassword ? "text" : "password"}
                      placeholder="Tu contraseña"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    >
                      <TextField.Slot side="right">
                        <Button
                          type="button"
                          variant="ghost"
                          color="gray"
                          size="1"
                          onClick={() => setShowPassword((s) => !s)}
                          style={{ cursor: "pointer" }}
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </Button>
                      </TextField.Slot>
                    </TextField.Root>
                  </Flex>

                  {loginError && (
                    <Text color="red" size="2">
                      {loginError}
                    </Text>
                  )}

                  <Button
                    type="submit"
                    size="3"
                    color="orange"
                    disabled={loginLoading}
                    style={{
                      cursor: "pointer",
                      background: BRAND_ORANGE,
                      marginTop: 8,
                    }}
                  >
                    {loginLoading ? <Spinner size="2" /> : "Iniciar Sesión"}
                  </Button>
                </Flex>
              </form>
            </Tabs.Content>

            {/* REGISTER */}
            <Tabs.Content value="register">
              {regSuccess ? (
                <Flex direction="column" align="center" gap="3" py="4">
                  <ChefHat size={40} color={BRAND_ORANGE} />
                  <Text size="3" weight="bold" align="center">
                    ¡Registro exitoso!
                  </Text>
                  <Text size="2" color="gray" align="center">
                    Redirigiendo a tu panel...
                  </Text>
                  <Spinner size="2" />
                </Flex>
              ) : (
                <form onSubmit={handleRegister}>
                  <Flex direction="column" gap="3">
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">Nombre completo *</Text>
                      <TextField.Root
                        placeholder="Ana García"
                        value={regNombre}
                        onChange={(e) => setRegNombre(e.target.value)}
                        required
                      />
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">Nombre del negocio *</Text>
                      <TextField.Root
                        placeholder="Cocina La Familia"
                        value={regEmpresa}
                        onChange={(e) => setRegEmpresa(e.target.value)}
                        required
                      />
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">Email *</Text>
                      <TextField.Root
                        type="email"
                        placeholder="ana@cocina.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">Teléfono</Text>
                      <TextField.Root
                        placeholder="5512345678"
                        value={regTelefono}
                        onChange={(e) => setRegTelefono(e.target.value)}
                      />
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">Contraseña *</Text>
                      <TextField.Root
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                    </Flex>

                    {regError && (
                      <Text color="red" size="2">
                        {regError}
                      </Text>
                    )}

                    <Button
                      type="submit"
                      size="3"
                      color="orange"
                      disabled={regLoading}
                      style={{ cursor: "pointer", background: BRAND_ORANGE, marginTop: 8 }}
                    >
                      {regLoading ? <Spinner size="2" /> : "Crear Cuenta"}
                    </Button>
                  </Flex>
                </form>
              )}
            </Tabs.Content>

            {/* FORGOT */}
            <Tabs.Content value="forgot">
              {forgotSuccess ? (
                <Flex direction="column" align="center" gap="3" py="4">
                  <Text size="3" weight="bold" align="center">
                    Email enviado
                  </Text>
                  <Text size="2" color="gray" align="center">
                    Revisa tu bandeja de entrada y sigue las instrucciones para
                    restablecer tu contraseña.
                  </Text>
                  <Button
                    variant="soft"
                    color="orange"
                    onClick={() => {
                      setForgotSuccess(false);
                      setView("login");
                    }}
                  >
                    Volver al inicio
                  </Button>
                </Flex>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <Flex direction="column" gap="3">
                    <Text size="2" color="gray">
                      Ingresa tu email y te enviaremos un link para restablecer tu
                      contraseña.
                    </Text>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">Email</Text>
                      <TextField.Root
                        type="email"
                        placeholder="tu@email.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </Flex>

                    {forgotError && (
                      <Text color="red" size="2">
                        {forgotError}
                      </Text>
                    )}

                    <Button
                      type="submit"
                      size="3"
                      color="orange"
                      disabled={forgotLoading}
                      style={{ cursor: "pointer", background: BRAND_ORANGE, marginTop: 8 }}
                    >
                      {forgotLoading ? <Spinner size="2" /> : "Enviar Email"}
                    </Button>
                  </Flex>
                </form>
              )}
            </Tabs.Content>
          </Tabs.Root>
        </Box>
      </Box>
    </Flex>
  );
}
