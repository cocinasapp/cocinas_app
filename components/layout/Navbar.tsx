"use client";

import { Badge, Button, DropdownMenu, Flex, IconButton, Text } from "@radix-ui/themes";
import { ChefHat, MessageSquare, LogOut, Menu as MenuIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BRAND_ORANGE } from "@/lib/constants";

interface NavbarProps {
  showConversaciones?: boolean;
  onKitchenConfig?: () => void;
  onUsers?: () => void;
  onManualOrder?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  cocina: "Cocina",
  mesero: "Mesero",
  repartidor: "Repartidor",
};

const ROLE_COLORS: Record<string, "orange" | "blue" | "green" | "purple"> = {
  admin: "orange",
  cocina: "blue",
  mesero: "green",
  repartidor: "purple",
};

export function Navbar({
  showConversaciones,
  onKitchenConfig,
  onUsers,
  onManualOrder,
}: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const role = user?.profile.rol ?? "cocina";
  const businessName = user?.profile.empresa ?? "Cocinas App";

  return (
    <nav
      style={{
        background: "#fff",
        borderBottom: "1px solid #ffe0b2",
        padding: "0 24px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 8px rgba(255,122,0,0.08)",
        maxWidth: "100vw",
      }}
    >
      {/* Left: Logo + Brand */}
      <Flex align="center" gap="2" style={{ flexShrink: 1, minWidth: 0 }}>
        <ChefHat size={28} color={BRAND_ORANGE} style={{ flexShrink: 0 }} />
        <Text
          weight="bold"
          size="4"
          className="navbar-brand-text"
          style={{ color: BRAND_ORANGE }}
        >
          {businessName}
        </Text>
      </Flex>

      {/* Right: acciones completas (solo desktop) */}
      <Flex align="center" gap="3" className="navbar-actions-desktop">
        {role === "admin" && onManualOrder && (
          <Button variant="soft" color="orange" size="2" onClick={onManualOrder} style={{ cursor: "pointer" }}>
            + Pedido Manual
          </Button>
        )}
        {role === "admin" && onKitchenConfig && (
          <Button variant="ghost" color="orange" size="2" onClick={onKitchenConfig} style={{ cursor: "pointer" }}>
            Cocina
          </Button>
        )}
        {role === "admin" && onUsers && (
          <Button variant="ghost" color="orange" size="2" onClick={onUsers} style={{ cursor: "pointer" }}>
            Usuarios
          </Button>
        )}
        {(role === "admin" || showConversaciones) && (
          <Button variant="ghost" color="orange" size="2" onClick={() => router.push("/conversaciones")} style={{ cursor: "pointer" }}>
            <MessageSquare size={16} />
            Chats
          </Button>
        )}
        <Flex align="center" gap="2" style={{ marginLeft: 8 }}>
          <Badge color={ROLE_COLORS[role] ?? "orange"} variant="soft">
            {ROLE_LABELS[role] ?? role}
          </Badge>
          <Text size="2" color="gray">
            {user?.email}
          </Text>
        </Flex>
        <Button variant="ghost" color="gray" size="2" onClick={handleLogout} style={{ cursor: "pointer" }}>
          <LogOut size={16} />
        </Button>
      </Flex>

      {/* Right: mobile - botón primario visible + menú colapsado */}
      <Flex align="center" gap="2" className="navbar-menu-trigger" style={{ flexShrink: 0 }}>
        {role === "admin" && onManualOrder && (
          <Button variant="soft" color="orange" size="2" onClick={onManualOrder} style={{ cursor: "pointer" }}>
            + Pedido
          </Button>
        )}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <IconButton variant="ghost" color="gray" size="2" style={{ cursor: "pointer" }}>
              <MenuIcon size={20} />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Label>
              {ROLE_LABELS[role] ?? role} · {user?.email}
            </DropdownMenu.Label>
            {role === "admin" && onKitchenConfig && (
              <DropdownMenu.Item onSelect={onKitchenConfig}>Cocina</DropdownMenu.Item>
            )}
            {role === "admin" && onUsers && (
              <DropdownMenu.Item onSelect={onUsers}>Usuarios</DropdownMenu.Item>
            )}
            {(role === "admin" || showConversaciones) && (
              <DropdownMenu.Item onSelect={() => router.push("/conversaciones")}>
                Chats
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Separator />
            <DropdownMenu.Item color="red" onSelect={handleLogout}>
              Cerrar sesión
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Flex>
    </nav>
  );
}