"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  Flex,
  Text,
  Table,
  Spinner,
  Badge,
  Button,
} from "@radix-ui/themes";
import { X } from "lucide-react";
import { fetchOrderDetail } from "@/lib/api-client";
import { StatusBadge } from "./StatusBadge";
import type { Comanda, ComandaDesglose } from "@/lib/types";

interface OrderDetailModalProps {
  comanda: Comanda | null;
  open: boolean;
  onClose: () => void;
}

export function OrderDetailModal({
  comanda,
  open,
  onClose,
}: OrderDetailModalProps) {
  const [items, setItems] = useState<ComandaDesglose[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !comanda) return;
    setLoading(true);
    setError(null);
    fetchOrderDetail(comanda.id)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, comanda]);

  const total = comanda?.monto_total ?? 0;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Content style={{ maxWidth: 520, borderRadius: 16 }}>
        <Flex justify="between" align="center" mb="4">
          <Dialog.Title size="4">
            Detalle del Pedido
          </Dialog.Title>
          <Button variant="ghost" color="gray" onClick={onClose}>
            <X size={18} />
          </Button>
        </Flex>

        {comanda && (
          <Flex direction="column" gap="3">
            <Flex gap="4" wrap="wrap">
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">Cliente</Text>
                <Text weight="bold">{comanda.cliente_nombre}</Text>
              </Flex>
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">Status</Text>
                <StatusBadge status={comanda.status} size="2" />
              </Flex>
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">Entrega</Text>
                <Badge
                  color={comanda.tipo_entrega === "domicilio" ? "purple" : "teal"}
                  variant="soft"
                >
                  {comanda.tipo_entrega === "domicilio" ? "Domicilio" : "Local"}
                </Badge>
              </Flex>
              {comanda.es_extra && (
                <Flex direction="column" gap="1">
                  <Text size="1" color="gray">Tipo</Text>
                  <Badge color="amber" variant="soft">Extra</Badge>
                </Flex>
              )}
            </Flex>

            {comanda.direccion && (
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">Dirección</Text>
                <Text size="2">{comanda.direccion}</Text>
              </Flex>
            )}

            <Text size="1" color="gray" mt="2">Platillos</Text>
            {loading ? (
              <Flex justify="center" py="4">
                <Spinner size="3" />
              </Flex>
            ) : error ? (
              <Text color="red" size="2">{error}</Text>
            ) : items.length === 0 ? (
              <Text size="2" color="gray">Sin desglose disponible</Text>
            ) : (
              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Platillo</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell align="right">Precio</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {items.map((item, i) => (
                    <Table.Row key={i}>
                      <Table.Cell>{item.platillo ?? `ID: ${item.platillo_id}`}</Table.Cell>
                      <Table.Cell align="right">
                        {item.precio != null
                          ? `$${item.precio.toFixed(2)}`
                          : "-"}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}

            <Flex justify="end" mt="2">
              <Text weight="bold" size="3">
                Total: ${total.toFixed(2)}
              </Text>
            </Flex>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
