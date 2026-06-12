"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Flex, Spinner } from "@radix-ui/themes";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { ConversationsView } from "@/components/conversations/ConversationsView";

export default function ConversacionesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    if (!loading && user && user.profile.rol !== "admin") {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
        <Spinner size="3" />
      </Flex>
    );
  }

  return (
    <Flex direction="column" style={{ height: "100dvh", overflow: "hidden" }}>
      <Navbar showConversaciones />
      <Flex align="center" px="4" py="2" style={{ flexShrink: 0 }}>
        <Button
          variant="ghost"
          color="gray"
          size="2"
          onClick={() => router.push("/admin")}
          style={{ cursor: "pointer", gap: 6 }}
        >
          <ArrowLeft size={16} />
          Volver
        </Button>
      </Flex>
      <ConversationsView />
    </Flex>
  );
}
