"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Flex,
  Spinner,
  Table,
  Tabs,
  Text,
  TextField,
  Badge,
} from "@radix-ui/themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, RefreshCw, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import {
  fetchOrders,
  patchOrderStatus,
  checkAndUpdateGroupStatus,
} from "@/lib/api-client";
import { StatusBadge } from "./StatusBadge";
import { OrderDetailModal } from "./OrderDetailModal";
import { GROUP_COLORS } from "@/lib/constants";
import type { GroupColor } from "@/lib/constants";
import type { Comanda, OrderStatus } from "@/lib/types";

type GroupColor2 = GroupColor;

interface OrdersTableProps {
  role: "admin" | "cocina" | "mesero" | "repartidor";
  onEditOrder?: (comanda: Comanda) => void;
}

const PAGE_SIZE = 20;

// Tab configs per role
type TabDef = {
  key: string;
  label: string;
  filter: (c: Comanda) => boolean;
  nextStatus?: OrderStatus;
  nextLabel?: string;
};

function getTabsForRole(role: OrdersTableProps["role"]): TabDef[] {
  if (role === "repartidor") {
    return [
      {
        key: "listos",
        label: "Listos",
        filter: (c) => c.status === "LISTO_COCINA",
        nextStatus: "ENVIADO",
        nextLabel: "Marcar Enviado",
      },
      {
        key: "enviado",
        label: "Enviado",
        filter: (c) => c.status === "ENVIADO",
        nextStatus: "ENTREGADO",
        nextLabel: "Marcar Entregado",
      },
      {
        key: "entregado",
        label: "Entregado",
        filter: (c) => c.status === "ENTREGADO",
      },
    ];
  }

  const baseTabs: TabDef[] = [
    {
      key: "pendiente",
      label: "Pendiente",
      filter: (c) => c.status === "PENDIENTE",
      nextStatus: "EN_PROCESO",
      nextLabel: "Iniciar",
    },
    {
      key: "en_proceso",
      label: "En Proceso",
      filter: (c) => c.status === "EN_PROCESO",
      nextStatus: "TERMINADO",
      nextLabel: "Terminar",
    },
    {
      key: "terminado",
      label: "Terminado",
      // TERMINADO tab shows LISTO_COCINA orders (backend auto-promotes)
      filter: (c) => c.status === "LISTO_COCINA",
    },
    {
      key: "cancelado",
      label: "Cancelado",
      filter: (c) => c.status === "CANCELADO",
    },
  ];

  if (role === "admin") {
    baseTabs.splice(3, 0, {
      key: "listo_entrega",
      label: "Listo Entrega",
      filter: (c) => c.status === "ENVIADO" || c.status === "ENTREGADO",
    });
  }

  return baseTabs;
}

// Build group color map: groups with >1 comanda get a color
function buildGroupColorMap(comandas: Comanda[]): Map<string, GroupColor2> {
  const groupCounts = new Map<string, number>();
  for (const c of comandas) {
    if (c.pedido_grupo) {
      groupCounts.set(c.pedido_grupo, (groupCounts.get(c.pedido_grupo) ?? 0) + 1);
    }
  }

  const colorMap = new Map<string, GroupColor2>();
  let colorIdx = 0;
  for (const [grupo, count] of Array.from(groupCounts.entries())) {
    if (count >= 1) {
      colorMap.set(grupo, GROUP_COLORS[colorIdx % GROUP_COLORS.length]);
      colorIdx++;
    }
  }
  return colorMap;
}

export function OrdersTable({ role, onEditOrder }: OrdersTableProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>(() => {
    const tabs = getTabsForRole(role);
    return tabs[0]?.key ?? "pendiente";
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const tabs = useMemo(() => getTabsForRole(role), [role]);

  const { data: allOrders = [], isLoading, isFetching } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    refetchInterval: 5000,
  });

  const groupColorMap = useMemo(() => buildGroupColorMap(allOrders), [allOrders]);

  const currentTab = tabs.find((t) => t.key === activeTab) ?? tabs[0];

  const filtered = useMemo(() => {
    let list = allOrders.filter(currentTab?.filter ?? (() => true));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.cliente_nombre.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allOrders, currentTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const tab of tabs) {
      m[tab.key] = allOrders.filter(tab.filter).length;
    }
    return m;
  }, [allOrders, tabs]);

  const handleStatusUpdate = useCallback(
    async (comanda: Comanda, newStatus: OrderStatus) => {
      setUpdatingIds((s) => new Set(s).add(comanda.id));
      try {
        await patchOrderStatus(comanda.id, newStatus);

        // If updating to TERMINADO → check group promotion
        if (newStatus === "TERMINADO" && comanda.pedido_grupo) {
          await checkAndUpdateGroupStatus(comanda.pedido_grupo, comanda.id);
        }

        queryClient.invalidateQueries({ queryKey: ["orders"] });
      } catch (e) {
        console.error(e);
        alert("Error al actualizar status");
      } finally {
        setUpdatingIds((s) => {
          const next = new Set(s);
          next.delete(comanda.id);
          return next;
        });
      }
    },
    [queryClient]
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
    setSearch("");
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Box>
      <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
        <Flex justify="between" align="center" mb="3" wrap="wrap" gap="2">
          <Tabs.List>
            {tabs.map((tab) => (
              <Tabs.Trigger key={tab.key} value={tab.key}>
                <Flex align="center" gap="1">
                  <span style={{ fontWeight: 700 }}>{tab.label}</span>
                  {tabCounts[tab.key] > 0 && (
                    <Badge
                      color="orange"
                      variant="solid"
                      size="1"
                      style={{ minWidth: 18, justifyContent: "center" }}
                    >
                      {tabCounts[tab.key]}
                    </Badge>
                  )}
                </Flex>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Flex gap="2" align="center">
            <TextField.Root
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              size="2"
              style={{ width: 200 }}
            >
              <TextField.Slot>
                <Search size={14} />
              </TextField.Slot>
            </TextField.Root>

            <Button
              variant="ghost"
              color="gray"
              size="2"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["orders"] })
              }
              style={{ cursor: "pointer" }}
            >
              <RefreshCw size={14} className={isFetching ? "spin" : ""} />
            </Button>
          </Flex>
        </Flex>

        {tabs.map((tab) => (
          <Tabs.Content key={tab.key} value={tab.key}>
            {isLoading ? (
              <Flex justify="center" py="8">
                <Spinner size="3" />
              </Flex>
            ) : paginated.length === 0 ? (
              <Flex justify="center" py="8">
                <Text color="gray" size="3">
                  No hay pedidos en esta sección
                </Text>
              </Flex>
            ) : (
              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Hora</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Cliente</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Entrega</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Monto</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Grupo</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Acciones</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {paginated.map((comanda) => {
                    const groupColor = comanda.pedido_grupo
                      ? groupColorMap.get(comanda.pedido_grupo)
                      : undefined;
                    const isUpdating = updatingIds.has(comanda.id);

                    return (
                      <Table.Row key={comanda.id}>
                        <Table.Cell>
                          <Text size="2" color="gray">
                            {formatTime(comanda.created_at)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex direction="column" gap="1">
                            <Text size="2" weight="medium">
                              {comanda.cliente_nombre}
                            </Text>
                            {comanda.es_extra && (
                              <Badge color="amber" variant="soft" size="1">
                                Extra
                              </Badge>
                            )}
                          </Flex>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex direction="column" gap="1">
                            <Badge
                              color={
                                comanda.tipo_entrega === "domicilio"
                                  ? "purple"
                                  : "teal"
                              }
                              variant="soft"
                              size="1"
                            >
                              {comanda.tipo_entrega === "domicilio"
                                ? "Domicilio"
                                : "Local"}
                            </Badge>
                            {comanda.direccion && (
                              <Text size="1" color="gray">
                                {comanda.direccion.slice(0, 40)}
                                {comanda.direccion.length > 40 ? "..." : ""}
                              </Text>
                            )}
                          </Flex>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2" weight="medium">
                            ${comanda.monto_total.toFixed(2)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <StatusBadge status={comanda.status} />
                        </Table.Cell>
                        <Table.Cell>
                          {groupColor && comanda.pedido_grupo ? (
                            <Badge
                              color={groupColor as GroupColor}
                              variant="soft"
                              size="1"
                            >
                              {comanda.pedido_grupo.slice(0, 8)}
                            </Badge>
                          ) : (
                            <Text size="1" color="gray">—</Text>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap="2" align="center">
                            <Button
                              size="1"
                              variant="ghost"
                              color="gray"
                              onClick={() => {
                                setSelectedComanda(comanda);
                                setDetailOpen(true);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <Eye size={14} />
                            </Button>

                            {role === "admin" && onEditOrder && (
                              <Button
                                size="1"
                                variant="soft"
                                color="orange"
                                onClick={() => onEditOrder(comanda)}
                                style={{ cursor: "pointer" }}
                              >
                                Editar
                              </Button>
                            )}

                            {tab.nextStatus && (
                              <Button
                                size="1"
                                variant="soft"
                                color="orange"
                                disabled={isUpdating}
                                onClick={() =>
                                  handleStatusUpdate(comanda, tab.nextStatus!)
                                }
                                style={{ cursor: "pointer" }}
                              >
                                {isUpdating ? (
                                  <Spinner size="1" />
                                ) : (
                                  tab.nextLabel ?? "Actualizar"
                                )}
                              </Button>
                            )}

                            {role === "admin" &&
                              comanda.status !== "CANCELADO" &&
                              comanda.status !== "ENTREGADO" && (
                                <Button
                                  size="1"
                                  variant="ghost"
                                  color="red"
                                  disabled={isUpdating}
                                  onClick={() =>
                                    handleStatusUpdate(comanda, "CANCELADO")
                                  }
                                  style={{ cursor: "pointer" }}
                                >
                                  Cancelar
                                </Button>
                              )}
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Flex justify="center" align="center" gap="3" mt="4">
                <Button
                  variant="ghost"
                  size="2"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  style={{ cursor: "pointer" }}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Text size="2">
                  {page} / {totalPages}
                </Text>
                <Button
                  variant="ghost"
                  size="2"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  style={{ cursor: "pointer" }}
                >
                  <ChevronRight size={16} />
                </Button>
              </Flex>
            )}
          </Tabs.Content>
        ))}
      </Tabs.Root>

      <OrderDetailModal
        comanda={selectedComanda}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </Box>
  );
}
