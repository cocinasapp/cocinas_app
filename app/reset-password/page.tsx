"use client";

import { useState, useEffect } from "react";
import { Box, Button, Flex, Text, TextField, Spinner } from "@radix-ui/themes";
import { ChefHat } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase-client";
import { BRAND_ORANGE, LOCAL_STORAGE_TOKEN_KEY } from "@/lib/constants";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // When user clicks the reset link, Supabase sets the session via URL hash
    supabaseAuth.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, session.access_token);
        setSessionReady(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabaseAuth.auth.updateUser({ password });
      if (err) throw new Error(err.message);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al actualizar contraseña");
    } finally {
      setLoading(false);
    }
  };

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
        <Flex direction="column" align="center" mb="6" gap="2">
          <ChefHat size={32} color={BRAND_ORANGE} />
          <Text size="5" weight="bold" style={{ color: BRAND_ORANGE }}>
            Nueva Contraseña
          </Text>
        </Flex>

        <Box className="auth-card">
          {success ? (
            <Flex direction="column" align="center" gap="3" py="4">
              <Text size="3" weight="bold" align="center" style={{ color: "green" }}>
                ¡Contraseña actualizada!
              </Text>
              <Text size="2" color="gray" align="center">
                Redirigiendo al inicio de sesión...
              </Text>
              <Spinner size="2" />
            </Flex>
          ) : !sessionReady ? (
            <Flex direction="column" align="center" gap="3" py="4">
              <Spinner size="3" />
              <Text size="2" color="gray" align="center">
                Verificando enlace de recuperación...
              </Text>
              <Text size="1" color="gray" align="center">
                Si este mensaje persiste, el enlace puede haber expirado.
              </Text>
              <Button
                variant="soft"
                color="orange"
                onClick={() => router.push("/forgot-password")}
              >
                Solicitar nuevo enlace
              </Button>
            </Flex>
          ) : (
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="3">
                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium">Nueva contraseña</Text>
                  <TextField.Root
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Flex>
                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium">Confirmar contraseña</Text>
                  <TextField.Root
                    type="password"
                    placeholder="Repite la contraseña"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </Flex>

                {error && <Text color="red" size="2">{error}</Text>}

                <Button
                  type="submit"
                  size="3"
                  color="orange"
                  disabled={loading}
                  style={{ cursor: "pointer", background: BRAND_ORANGE }}
                >
                  {loading ? <Spinner size="2" /> : "Actualizar Contraseña"}
                </Button>
              </Flex>
            </form>
          )}
        </Box>
      </Box>
    </Flex>
  );
}
