"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Flex, Spinner, Text } from "@radix-ui/themes";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { KitchenManagementModal } from "@/components/kitchen/KitchenManagementModal";
import { UsersModal } from "@/components/users/UsersModal";
import { ManualOrderModal } from "@/components/orders/ManualOrderModal";
import type { Comanda } from "@/lib/types";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [kitchenOpen, setKitchenOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [editComanda, setEditComanda] = useState<Comanda | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    if (!loading && user && user.profile.rol !== "admin") {
      const destinations: Record<string, string> = {
        cocina: "/cocina",
        mesero: "/mesero",
        repartidor: "/repartidor",
      };
      router.replace(destinations[user.profile.rol] ?? "/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
        <Spinner size="3" />
      </Flex>
    );
  }

  const handleEditOrder = (comanda: Comanda) => {
    setEditComanda(comanda);
    setManualOpen(true);
  };

  return (
    <Box style={{ minHeight: "100vh" }}>
      <Navbar
        showConversaciones
        onKitchenConfig={() => setKitchenOpen(true)}
        onUsers={() => setUsersOpen(true)}
        onManualOrder={() => {
          setEditComanda(null);
          setManualOpen(true);
        }}
      />

      <Box className="page-container">
        <Flex justify="between" align="center" mb="5">
          <Flex direction="column" gap="1">
            <Text size="6" weight="bold" style={{ color: "#1a1a1a" }}>
              Panel de Administración
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

        <OrdersTable role="admin" onEditOrder={handleEditOrder} />
      </Box>

      <KitchenManagementModal
        open={kitchenOpen}
        onClose={() => setKitchenOpen(false)}
      />
      <UsersModal open={usersOpen} onClose={() => setUsersOpen(false)} />
      <ManualOrderModal
        open={manualOpen}
        onClose={() => {
          setManualOpen(false);
          setEditComanda(null);
        }}
        editComanda={editComanda}
      />
    </Box>
  );
}
