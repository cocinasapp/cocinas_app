"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Flex, Spinner, Text } from "@radix-ui/themes";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { OrdersTable } from "@/components/orders/OrdersTable";

export default function CocinaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    if (!loading && user && user.profile.rol !== "cocina" && user.profile.rol !== "admin") {
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
    <Box style={{ minHeight: "100vh" }}>
      <Navbar />
      <Box className="page-container">
        <Flex justify="between" align="center" mb="5">
          <Flex direction="column" gap="1">
            <Text size="6" weight="bold" style={{ color: "#1a1a1a" }}>
              Vista Cocina
            </Text>
            <Text size="2" color="gray">
              {new Date().toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </Flex>
        </Flex>
        <OrdersTable role="cocina" />
      </Box>
    </Box>
  );
}
