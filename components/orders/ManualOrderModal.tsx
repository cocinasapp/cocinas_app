"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  Button,
  Flex,
  Text,
  TextField,
  Select,
  Separator,
  Badge,
  Spinner,
} from "@radix-ui/themes";
import { X, Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchConfig,
  fetchPlatillos,
  fetchTiempos,
  createManualOrder,
  editGroupOrder,
  fetchOrderDetail,
} from "@/lib/api-client";
import type { Comanda, ComidaItem, PlatilloSeleccionado, Platillo } from "@/lib/types";

interface ManualOrderModalProps {
  open: boolean;
  onClose: () => void;
  editComanda?: Comanda | null;
  onSuccess?: () => void;
}

const DEFAULT_COMIDA: ComidaItem = { platillos: [] };

export function ManualOrderModal({
  open,
  onClose,
  editComanda,
  onSuccess,
}: ManualOrderModalProps) {
  const isEdit = !!editComanda;

  const [clienteNombre, setClienteNombre] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<"local" | "domicilio">("local");
  const [direccion, setDireccion] = useState("");
  const [comidas, setComidas] = useState<ComidaItem[]>([{ platillos: [] }]);
  const [extras, setExtras] = useState<PlatilloSeleccionado[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: config } = useQuery({ queryKey: ["config"], queryFn: fetchConfig });
  const { data: tiempos = [] } = useQuery({ queryKey: ["tiempos"], queryFn: fetchTiempos });
  const { data: platillos = [] } = useQuery({ queryKey: ["platillos"], queryFn: fetchPlatillos });

  const activeTiempos = tiempos.filter((t) => t.activo);
  const activePlatillos = platillos.filter((p) => p.activo);

  useEffect(() => {
    if (!open) {
      setClienteNombre("");
      setTipoEntrega("local");
      setDireccion("");
      setComidas([{ platillos: [] }]);
      setExtras([]);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (editComanda && open) {
      setClienteNombre(editComanda.cliente_nombre);
      setTipoEntrega(editComanda.tipo_entrega);
      setDireccion(editComanda.direccion ?? "");
      fetchOrderDetail(editComanda.id).then((items) => {
        setComidas([{
          platillos: items.map((item) => ({
            platillo_id: item.platillo_id,
            platillo_nombre: item.platillo ?? "",
            precio: item.precio ?? 0,
          })),
        }]);
      }).catch(() => {
        setComidas([{ platillos: [] }]);
      });
    }
  }, [editComanda, open]);

  const getPlatillosByTiempo = (tiempoId: string): Platillo[] =>
    activePlatillos.filter((p) => p.tiempo_id === tiempoId);

  // ─── Comidas handlers ────────────────────────────────────────────────────────

  const addComida = () => setComidas((prev) => [...prev, { platillos: [] }]);

  const removeComida = (idx: number) =>
    setComidas((prev) => prev.filter((_, i) => i !== idx));

  const addPlatilloToComida = (comidaIdx: number, platillo: Platillo) => {
    setComidas((prev) =>
      prev.map((c, i) => {
        if (i !== comidaIdx) return c;
        const exists = c.platillos.some((p) => p.platillo_id === platillo.id);
        if (exists) return c;
        return {
          ...c,
          platillos: [
            ...c.platillos,
            {
              platillo_id: platillo.id,
              platillo_nombre: platillo.platillo,
              precio: platillo.precio,
            },
          ],
        };
      })
    );
  };

  const removePlatilloFromComida = (comidaIdx: number, platilloId: string) => {
    setComidas((prev) =>
      prev.map((c, i) => {
        if (i !== comidaIdx) return c;
        return { ...c, platillos: c.platillos.filter((p) => p.platillo_id !== platilloId) };
      })
    );
  };

  // ─── Extras handlers ─────────────────────────────────────────────────────────

  const addExtra = (platillo: Platillo) => {
    setExtras((prev) => {
      const exists = prev.some((p) => p.platillo_id === platillo.id);
      if (exists) return prev;
      return [
        ...prev,
        { platillo_id: platillo.id, platillo_nombre: platillo.platillo, precio: platillo.precio },
      ];
    });
  };

  const removeExtra = (platilloId: string) =>
    setExtras((prev) => prev.filter((p) => p.platillo_id !== platilloId));

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!clienteNombre.trim()) {
      setError("El nombre del cliente es requerido");
      return;
    }
    if (!config?.backend_url) {
      setError("No hay backend_url configurado");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEdit && editComanda?.pedido_grupo) {
        await editGroupOrder(
          editComanda.pedido_grupo,
          {
            comandas: [{
              comanda_id: editComanda.id,
              platillos: comidas[0]?.platillos ?? [],
            }],
            precio_menu: config.precio_menu,
            descuento_por_platillo: config.descuento_por_platillo,
          },
          config.backend_url
        );
      } else {
        await createManualOrder(
          {
            cliente_nombre: clienteNombre.trim(),
            tipo_entrega: tipoEntrega,
            direccion: direccion.trim(),
            comidas,
            extras,
            precio_menu: config.precio_menu,
            descuento_por_platillo: config.descuento_por_platillo,
          },
          config.backend_url
        );
      }

      onSuccess?.();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear pedido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Content style={{ maxWidth: 680, maxHeight: "85vh", overflow: "auto", borderRadius: 16 }}>
        <Flex justify="between" align="center" mb="4">
          <Dialog.Title>
            {isEdit ? "Editar Pedido" : "Pedido Manual"}
          </Dialog.Title>
          <Button variant="ghost" color="gray" onClick={onClose}>
            <X size={18} />
          </Button>
        </Flex>

        <Flex direction="column" gap="4">
          {/* Basic info */}
          <Flex gap="3" wrap="wrap">
            <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 180 }}>
              <Text size="2" weight="medium">Cliente *</Text>
              <TextField.Root
                placeholder="Nombre del cliente"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
              />
            </Flex>

            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Tipo de Entrega</Text>
              <Select.Root
                value={tipoEntrega}
                onValueChange={(v) => setTipoEntrega(v as "local" | "domicilio")}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="local">Local</Select.Item>
                  <Select.Item value="domicilio">Domicilio</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>
          </Flex>

          {tipoEntrega === "domicilio" && (
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Dirección</Text>
              <TextField.Root
                placeholder="Dirección de entrega"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </Flex>
          )}

          <Separator />

          {/* Comidas */}
          <Flex justify="between" align="center">
            <Text size="3" weight="bold">Comidas</Text>
            {!isEdit && (
              <Button size="2" variant="soft" color="orange" onClick={addComida}>
                <Plus size={14} /> Agregar Comida
              </Button>
            )}
          </Flex>

          {comidas.map((comida, comidaIdx) => (
            <Box
              key={comidaIdx}
              p="3"
              style={{ border: "1px solid var(--orange-6)", borderRadius: 12 }}
            >
              <Flex justify="between" align="center" mb="2">
                <Text size="2" weight="medium">Comida {comidaIdx + 1}</Text>
                {comidas.length > 1 && (
                  <Button
                    size="1"
                    variant="ghost"
                    color="red"
                    onClick={() => removeComida(comidaIdx)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </Flex>

              {/* Selected platillos */}
              {comida.platillos.length > 0 && (
                <Flex gap="1" wrap="wrap" mb="2">
                  {comida.platillos.map((p) => (
                    <Badge
                      key={p.platillo_id}
                      color="orange"
                      variant="soft"
                      style={{ cursor: "pointer" }}
                      onClick={() => removePlatilloFromComida(comidaIdx, p.platillo_id)}
                    >
                      {p.platillo_nombre} × ${p.precio} ✕
                    </Badge>
                  ))}
                </Flex>
              )}

              {/* Tiempos + platillos picker */}
              {activeTiempos.map((tiempo) => {
                const pts = getPlatillosByTiempo(tiempo.id);
                if (pts.length === 0) return null;
                return (
                  <Box key={tiempo.id} mb="2">
                    <Text size="1" color="gray" weight="medium">{tiempo.nombre}</Text>
                    <Flex gap="1" wrap="wrap" mt="1">
                      {pts.map((p) => {
                        const selected = comida.platillos.some(
                          (sp) => sp.platillo_id === p.id
                        );
                        return (
                          <Badge
                            key={p.id}
                            color={selected ? "orange" : "gray"}
                            variant={selected ? "solid" : "soft"}
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              selected
                                ? removePlatilloFromComida(comidaIdx, p.id)
                                : addPlatilloToComida(comidaIdx, p)
                            }
                          >
                            {p.platillo}
                          </Badge>
                        );
                      })}
                    </Flex>
                  </Box>
                );
              })}
            </Box>
          ))}

          <Separator />

          {/* Extras */}
          <Text size="3" weight="bold">Extras</Text>
          {extras.length > 0 && (
            <Flex gap="1" wrap="wrap">
              {extras.map((e) => (
                <Badge
                  key={e.platillo_id}
                  color="amber"
                  variant="soft"
                  style={{ cursor: "pointer" }}
                  onClick={() => removeExtra(e.platillo_id)}
                >
                  {e.platillo_nombre} × ${e.precio} ✕
                </Badge>
              ))}
            </Flex>
          )}

          <Flex gap="1" wrap="wrap">
            {activePlatillos.map((p) => (
              <Badge
                key={p.id}
                color={extras.some((e) => e.platillo_id === p.id) ? "amber" : "gray"}
                variant="soft"
                style={{ cursor: "pointer" }}
                onClick={() => addExtra(p)}
              >
                + {p.platillo}
              </Badge>
            ))}
          </Flex>

          {error && (
            <Text color="red" size="2">
              {error}
            </Text>
          )}

          <Flex gap="2" justify="end" mt="2">
            <Button variant="soft" color="gray" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              variant="solid"
              color="orange"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ cursor: "pointer" }}
            >
              {submitting ? <Spinner size="1" /> : isEdit ? "Guardar Cambios" : "Crear Pedido"}
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
