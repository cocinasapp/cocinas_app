"use client";

import { useState } from "react";
import { Box, Button, Flex, Text, TextField, Spinner } from "@radix-ui/themes";
import { ChefHat, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase-client";
import { BRAND_ORANGE } from "@/lib/constants";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Ingresa tu email");
      return;
    }
    setLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: err } = await supabaseAuth.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });
      if (err) throw new Error(err.message);
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al enviar email");
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
            Recuperar Contraseña
          </Text>
        </Flex>

        <Box className="auth-card">
          {success ? (
            <Flex direction="column" align="center" gap="3" py="4">
              <Text size="3" weight="bold" align="center">
                Email enviado
              </Text>
              <Text size="2" color="gray" align="center">
                Revisa tu bandeja de entrada y sigue las instrucciones.
              </Text>
              <Button
                variant="soft"
                color="orange"
                onClick={() => router.push("/login")}
              >
                <ArrowLeft size={14} /> Volver al inicio
              </Button>
            </Flex>
          ) : (
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="3">
                <Text size="2" color="gray">
                  Ingresa tu email y te enviaremos instrucciones para restablecer tu
                  contraseña.
                </Text>

                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium">Email</Text>
                  <TextField.Root
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  {loading ? <Spinner size="2" /> : "Enviar Email"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  color="gray"
                  onClick={() => router.push("/login")}
                  style={{ cursor: "pointer" }}
                >
                  <ArrowLeft size={14} /> Volver al inicio
                </Button>
              </Flex>
            </form>
          )}
        </Box>
      </Box>
    </Flex>
  );
}
