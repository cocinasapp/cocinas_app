"use client";

import { useState } from "react";
import {
  Dialog,
  Button,
  Flex,
  Text,
  TextField,
  Select,
  Table,
  Spinner,
  Badge,
} from "@radix-ui/themes";
import { X, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUsuarios, createUsuario } from "@/lib/api-client";
import type { UserRole } from "@/lib/types";

interface UsersModalProps {
  open: boolean;
  onClose: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  cocina: "Cocina",
  mesero: "Mesero",
  repartidor: "Repartidor",
};

const ROLE_COLORS: Record<UserRole, "orange" | "blue" | "green" | "purple"> = {
  admin: "orange",
  cocina: "blue",
  mesero: "green",
  repartidor: "purple",
};

export function UsersModal({ open, onClose }: UsersModalProps) {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: fetchUsuarios,
    enabled: open,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [rol, setRol] = useState<UserRole>("cocina");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setNombre("");
    setTelefono("");
    setRol("cocina");
    setError(null);
  };

  const handleCreate = async () => {
    if (!email.trim() || !password.trim() || !nombre.trim()) {
      setError("Email, contraseña y nombre son requeridos");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await createUsuario({ email: email.trim(), password, nombre_completo: nombre.trim(), telefono: telefono.trim() || undefined, rol });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setSuccess(true);
      resetForm();
      setTimeout(() => setSuccess(false), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear usuario");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Content style={{ maxWidth: 620, maxHeight: "85vh", overflow: "auto", borderRadius: 16 }}>
        <Flex justify="between" align="center" mb="4">
          <Dialog.Title>Usuarios</Dialog.Title>
          <Button variant="ghost" color="gray" onClick={onClose}>
            <X size={18} />
          </Button>
        </Flex>

        {/* Create user form */}
        <Flex direction="column" gap="3" mb="5">
          <Text size="3" weight="bold">Crear usuario</Text>
          <Flex gap="3" wrap="wrap">
            <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 160 }}>
              <Text size="2">Nombre completo *</Text>
              <TextField.Root
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ana García"
              />
            </Flex>
            <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 160 }}>
              <Text size="2">Email *</Text>
              <TextField.Root
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ana@ejemplo.com"
              />
            </Flex>
          </Flex>

          <Flex gap="3" wrap="wrap">
            <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 160 }}>
              <Text size="2">Contraseña *</Text>
              <TextField.Root
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </Flex>
            <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 160 }}>
              <Text size="2">Teléfono</Text>
              <TextField.Root
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="5512345678"
              />
            </Flex>
          </Flex>

          <Flex align="center" gap="3">
            <Flex direction="column" gap="1">
              <Text size="2">Rol</Text>
              <Select.Root value={rol} onValueChange={(v) => setRol(v as UserRole)}>
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="cocina">Cocina</Select.Item>
                  <Select.Item value="mesero">Mesero</Select.Item>
                  <Select.Item value="repartidor">Repartidor</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>

            <Flex align="end" style={{ marginTop: "auto" }}>
              <Button
                color="orange"
                onClick={handleCreate}
                disabled={creating}
                style={{ cursor: "pointer" }}
              >
                {creating ? <Spinner size="1" /> : <><Plus size={14} /> Crear</>}
              </Button>
            </Flex>
          </Flex>

          {error && <Text color="red" size="2">{error}</Text>}
          {success && <Text color="green" size="2">Usuario creado exitosamente</Text>}
        </Flex>

        {/* Users list */}
        <Text size="3" weight="bold" mb="3">Usuarios actuales</Text>
        {isLoading ? (
          <Flex justify="center" py="4">
            <Spinner size="2" />
          </Flex>
        ) : users.length === 0 ? (
          <Text color="gray" size="2">No hay usuarios sub-cuenta</Text>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Nombre</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Rol</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Activo</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.map((u) => (
                <Table.Row key={u.user_id}>
                  <Table.Cell>{u.nombre_completo}</Table.Cell>
                  <Table.Cell>
                    <Text size="2" color="gray">{u.email}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={ROLE_COLORS[u.rol] ?? "gray"} variant="soft" size="1">
                      {ROLE_LABELS[u.rol] ?? u.rol}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={u.activo ? "green" : "red"} variant="soft" size="1">
                      {u.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
