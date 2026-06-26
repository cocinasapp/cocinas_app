"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  Box,
  Flex,
  Text,
  Badge,
  Spinner,
  Button
} from "@radix-ui/themes";
import { X, Maximize2 } from "lucide-react";
import { fetchOrderDetailsBatch } from "@/lib/api-client";
import type { Comanda, ComandaDesglose } from "@/lib/types";

interface LocalTablesModalProps {
  open: boolean;
  onClose: () => void;
  comandas: Comanda[]; // ya filtradas: tipo_entrega === "local" && status === "EN_PROCESO"
}

interface MesaGroup {
  pedido_grupo: string;
  cliente_nombre: string;
  comandaIds: string[];
}

interface TiempoGroup {
  tiempo_id: number | null;
  tiempo_nombre: string;
  tiempo_orden: number;
  platillos: string[];
}

function agruparPorMesa(comandas: Comanda[]): MesaGroup[] {
  const map = new Map<string, MesaGroup>();
  for (const c of comandas) {
    const key = c.pedido_grupo ?? c.id; // fallback si por algún motivo no tiene grupo
    if (!map.has(key)) {
      map.set(key, {
        pedido_grupo: key,
        cliente_nombre: c.cliente_nombre,
        comandaIds: [],
      });
    }
    map.get(key)!.comandaIds.push(c.id);
  }
  return Array.from(map.values());
}

function agruparPorTiempo(items: ComandaDesglose[]): TiempoGroup[] {
  const map = new Map<string, TiempoGroup>();
  for (const item of items) {
    const key = item.tiempo_nombre ?? "Sin tiempo";
    if (!map.has(key)) {
      map.set(key, {
        tiempo_id: item.tiempo_id ?? null,
        tiempo_nombre: key,
        tiempo_orden: item.tiempo_orden ?? 999,
        platillos: [],
      });
    }
    if (item.platillo) {
      map.get(key)!.platillos.push(item.platillo);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.tiempo_orden - b.tiempo_orden);
}

function MesaCard({
  mesa,
  detalle,
  loading,
  onZoom,
}: {
  mesa: MesaGroup;
  detalle: ComandaDesglose[] | undefined;
  loading: boolean;
  onZoom: () => void;
}) {
  const tiempos = useMemo(() => agruparPorTiempo(detalle ?? []), [detalle]);

  return (
    <Box
      style={{
        border: "1px solid var(--gray-5)",
        borderRadius: 12,
        padding: 16,
        background: "white",
      }}
    >
      <Flex justify="between" align="center" mb="3">
        <Text size="4" weight="bold">
          {mesa.cliente_nombre}
        </Text>
        <Button variant="ghost" color="gray" size="1" onClick={onZoom} style={{ cursor: "pointer" }}>
          <Maximize2 size={14} />
        </Button>
      </Flex>

      {loading ? (
        <Flex justify="center" py="4">
          <Spinner size="2" />
        </Flex>
      ) : tiempos.length === 0 ? (
        <Text size="2" color="gray">
          Sin platillos registrados
        </Text>
      ) : (
        <Flex direction="column" gap="3">
          {tiempos.map((t) => (
            <Box key={t.tiempo_nombre}>
              <Text size="2" weight="medium" color="gray">
                {t.tiempo_nombre}
              </Text>
              <Flex gap="2" wrap="wrap" mt="1">
                {t.platillos.map((p, i) => (
                  <Badge key={`${p}-${i}`} variant="soft" color="gray" size="2">
                    {p}
                  </Badge>
                ))}
              </Flex>
            </Box>
          ))}
        </Flex>
      )}
    </Box>
  );
}

export function LocalTablesModal({ open, onClose, comandas }: LocalTablesModalProps) {
  const [detallesPorGrupo, setDetallesPorGrupo] = useState<Record<string, ComandaDesglose[]>>({});
  const [loadingGroups, setLoadingGroups] = useState<Set<string>>(new Set());
  const [zoomMesa, setZoomMesa] = useState<MesaGroup | null>(null);

  const mesas = useMemo(() => agruparPorMesa(comandas), [comandas]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function cargar() {
      for (const mesa of mesas) {
        if (detallesPorGrupo[mesa.pedido_grupo]) continue; // ya cargado
        setLoadingGroups((s) => new Set(s).add(mesa.pedido_grupo));
        try {
          const items = await fetchOrderDetailsBatch(mesa.comandaIds);
          if (!cancelled) {
            setDetallesPorGrupo((prev) => ({ ...prev, [mesa.pedido_grupo]: items }));
          }
        } catch (e) {
          console.error("Error cargando detalle de mesa", mesa.pedido_grupo, e);
        } finally {
          if (!cancelled) {
            setLoadingGroups((s) => {
              const next = new Set(s);
              next.delete(mesa.pedido_grupo);
              return next;
            });
          }
        }
      }
    }

    cargar();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mesas]);

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
        <Dialog.Content style={{ maxWidth: 900, maxHeight: "85vh" }}>
          <Flex justify="between" align="center" mb="4">
            <Dialog.Title size="5">Pedidos en Local — En Proceso</Dialog.Title>
            <Button variant="ghost" color="gray" onClick={onClose} style={{ cursor: "pointer" }}>
              <X size={18} />
            </Button>
          </Flex>

          <Box style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {mesas.length === 0 ? (
              <Flex justify="center" py="8">
                <Text color="gray" size="3">
                  No hay pedidos de local en proceso
                </Text>
              </Flex>
            ) : (
              <Flex direction="column" gap="3" pr="3">
                {mesas.map((mesa) => (
                  <MesaCard
                    key={mesa.pedido_grupo}
                    mesa={mesa}
                    detalle={detallesPorGrupo[mesa.pedido_grupo]}
                    loading={loadingGroups.has(mesa.pedido_grupo)}
                    onZoom={() => setZoomMesa(mesa)}
                  />
                ))}
              </Flex>
            )}
          </Box>
        </Dialog.Content>
      </Dialog.Root>

      {/* Zoom modal: misma tarjeta, más grande */}
      <Dialog.Root open={!!zoomMesa} onOpenChange={(o) => !o && setZoomMesa(null)}>
        <Dialog.Content style={{ maxWidth: 600 }}>
          {zoomMesa && (
            <>
              <Flex justify="between" align="center" mb="4">
                <Dialog.Title size="6">{zoomMesa.cliente_nombre}</Dialog.Title>
                <Button
                  variant="ghost"
                  color="gray"
                  onClick={() => setZoomMesa(null)}
                  style={{ cursor: "pointer" }}
                >
                  <X size={18} />
                </Button>
              </Flex>
              <Flex direction="column" gap="4">
                {agruparPorTiempo(detallesPorGrupo[zoomMesa.pedido_grupo] ?? []).map((t) => (
                  <Box key={t.tiempo_nombre}>
                    <Text size="3" weight="bold" color="gray">
                      {t.tiempo_nombre}
                    </Text>
                    <Flex gap="2" wrap="wrap" mt="2">
                      {t.platillos.map((p, i) => (
                        <Badge key={`${p}-${i}`} variant="soft" color="gray" size="3">
                          {p}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                ))}
              </Flex>
            </>
          )}
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}