"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  Button,
  Flex,
  Text,
  TextField,
  Table,
  Tabs,
  Spinner,
  Switch,
  Select,
  Badge,
} from "@radix-ui/themes";
import { X, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchConfig,
  saveConfig,
  fetchTiempos,
  createTiempo,
  toggleTiempo,
  fetchPlatillos,
  createPlatillo,
  togglePlatillo,
  updatePlatilloStock,
} from "@/lib/api-client";
import type { CocinaConfig, Tiempo, Platillo } from "@/lib/types";

interface KitchenManagementModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Config Tab ───────────────────────────────────────────────────────────────

function ConfigTab() {
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ["config"],
    queryFn: fetchConfig,
  });

  const [form, setForm] = useState<Partial<CocinaConfig>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConfig(form);
      queryClient.invalidateQueries({ queryKey: ["config"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert("Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading)
    return (
      <Flex justify="center" py="6">
        <Spinner size="3" />
      </Flex>
    );

  return (
    <Flex direction="column" gap="3">
      <Flex gap="3" wrap="wrap">
        <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 200 }}>
          <Text size="2">Nombre del negocio</Text>
          <TextField.Root
            value={form.business_name ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
          />
        </Flex>
        <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 200 }}>
          <Text size="2">Nombre del agente</Text>
          <TextField.Root
            value={form.agent_name ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, agent_name: e.target.value }))}
          />
        </Flex>
      </Flex>

      <Flex gap="3" wrap="wrap">
        <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 150 }}>
          <Text size="2">Precio menú</Text>
          <TextField.Root
            type="number"
            value={form.precio_menu ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, precio_menu: parseFloat(e.target.value) || 0 }))
            }
          />
        </Flex>
        <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 150 }}>
          <Text size="2">Descuento fijo omisión</Text>
          <TextField.Root
            type="number"
            value={form.descuento_fijo_omision ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                descuento_fijo_omision: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </Flex>
        <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 150 }}>
          <Text size="2">Precio desechables</Text>
          <TextField.Root
            type="number"
            value={form.precio_desechables ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                precio_desechables: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </Flex>
      </Flex>

      <Flex gap="4" align="center" wrap="wrap">
        <Flex align="center" gap="2">
          <Switch
            checked={form.descuento_por_platillo ?? false}
            onCheckedChange={(v) =>
              setForm((f) => ({ ...f, descuento_por_platillo: v }))
            }
          />
          <Text size="2">Descuento por platillo</Text>
        </Flex>
        <Flex align="center" gap="2">
          <Switch
            checked={form.cobro_desechables ?? false}
            onCheckedChange={(v) =>
              setForm((f) => ({ ...f, cobro_desechables: v }))
            }
          />
          <Text size="2">Cobrar desechables</Text>
        </Flex>
      </Flex>

      <Flex direction="column" gap="1">
        <Text size="2">Backend URL</Text>
        <TextField.Root
          value={form.backend_url ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, backend_url: e.target.value }))}
          placeholder="https://mi-backend.railway.app"
        />
      </Flex>

      <Flex justify="end">
        <Button
          color="orange"
          onClick={handleSave}
          disabled={saving}
          style={{ cursor: "pointer" }}
        >
          {saving ? <Spinner size="1" /> : saved ? "¡Guardado!" : "Guardar"}
        </Button>
      </Flex>
    </Flex>
  );
}

// ─── Tiempos Tab ─────────────────────────────────────────────────────────────

function TiemposTab() {
  const queryClient = useQueryClient();
  const { data: tiempos = [], isLoading } = useQuery({
    queryKey: ["tiempos"],
    queryFn: fetchTiempos,
  });

  const [newNombre, setNewNombre] = useState("");
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newNombre.trim()) return;
    setAdding(true);
    try {
      await createTiempo(newNombre.trim());
      queryClient.invalidateQueries({ queryKey: ["tiempos"] });
      setNewNombre("");
    } catch {
      alert("Error al crear tiempo");
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (tiempo: Tiempo) => {
    setTogglingId(tiempo.id);
    try {
      await toggleTiempo(tiempo.id, !tiempo.activo);
      queryClient.invalidateQueries({ queryKey: ["tiempos"] });
    } catch {
      alert("Error al actualizar tiempo");
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading)
    return (
      <Flex justify="center" py="6">
        <Spinner size="3" />
      </Flex>
    );

  return (
    <Flex direction="column" gap="3">
      <Flex gap="2">
        <TextField.Root
          placeholder="Nombre del tiempo (ej. Sopas)"
          value={newNombre}
          onChange={(e) => setNewNombre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          style={{ flex: 1 }}
        />
        <Button color="orange" onClick={handleAdd} disabled={adding}>
          {adding ? <Spinner size="1" /> : <><Plus size={14} /> Agregar</>}
        </Button>
      </Flex>

      {tiempos.length === 0 ? (
        <Text color="gray" size="2">No hay tiempos configurados</Text>
      ) : (
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Nombre</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Orden</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Activo</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {tiempos.map((t) => (
              <Table.Row key={t.id}>
                <Table.Cell>{t.nombre}</Table.Cell>
                <Table.Cell>{t.orden}</Table.Cell>
                <Table.Cell>
                  {togglingId === t.id ? (
                    <Spinner size="1" />
                  ) : (
                    <Switch
                      checked={t.activo}
                      onCheckedChange={() => handleToggle(t)}
                    />
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Flex>
  );
}

// ─── Platillos Tab ────────────────────────────────────────────────────────────

function PlatillosTab() {
  const queryClient = useQueryClient();
  const { data: tiempos = [] } = useQuery({
    queryKey: ["tiempos"],
    queryFn: fetchTiempos,
  });
  const { data: platillos = [], isLoading } = useQuery({
    queryKey: ["platillos"],
    queryFn: fetchPlatillos,
  });

  const activeTiempos = tiempos.filter((t) => t.activo);

  const [newNombre, setNewNombre] = useState("");
  const [newPrecio, setNewPrecio] = useState<number>(0);
  const [newTiempoId, setNewTiempoId] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const p of platillos) {
      initial[p.id] = p.stock != null ? String(p.stock) : "";
    }
    setStockEdits(initial);
  }, [platillos]);

  useEffect(() => {
    if (activeTiempos.length > 0 && !newTiempoId) {
      setNewTiempoId(activeTiempos[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiempos]);

  const handleAdd = async () => {
    if (!newNombre.trim() || !newTiempoId) return;
    setAdding(true);
    try {
      await createPlatillo({ platillo: newNombre.trim(), precio: newPrecio, tiempo_id: newTiempoId });
      queryClient.invalidateQueries({ queryKey: ["platillos"] });
      setNewNombre("");
      setNewPrecio(0);
    } catch {
      alert("Error al crear platillo");
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (p: Platillo) => {
    setTogglingId(p.id);
    try {
      await togglePlatillo(p.id, !p.activo);
      queryClient.invalidateQueries({ queryKey: ["platillos"] });
    } catch {
      alert("Error al actualizar platillo");
    } finally {
      setTogglingId(null);
    }
  };

  const handleStockBlur = async (p: Platillo) => {
    const raw = stockEdits[p.id] ?? "";
    const parsed = raw === "" ? null : parseInt(raw, 10);
    const current = p.stock ?? null;
    if (parsed === current) return;
    setSavingStockId(p.id);
    try {
      await updatePlatilloStock(p.id, parsed);
      queryClient.invalidateQueries({ queryKey: ["platillos"] });
    } catch {
      alert("Error al actualizar stock");
    } finally {
      setSavingStockId(null);
    }
  };

  const getTiempoNombre = (id: string) =>
    tiempos.find((t) => t.id === id)?.nombre ?? id;

  if (isLoading)
    return (
      <Flex justify="center" py="6">
        <Spinner size="3" />
      </Flex>
    );

  return (
    <Flex direction="column" gap="3">
      <Flex gap="2" wrap="wrap">
        <TextField.Root
          placeholder="Nombre del platillo"
          value={newNombre}
          onChange={(e) => setNewNombre(e.target.value)}
          style={{ flex: 2, minWidth: 140 }}
        />
        <TextField.Root
          type="number"
          placeholder="Precio"
          value={newPrecio || ""}
          onChange={(e) => setNewPrecio(parseFloat(e.target.value) || 0)}
          style={{ width: 100 }}
        />
        <Select.Root value={newTiempoId} onValueChange={setNewTiempoId}>
          <Select.Trigger placeholder="Tiempo" />
          <Select.Content>
            {activeTiempos.map((t) => (
              <Select.Item key={t.id} value={t.id}>
                {t.nombre}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <Button color="orange" onClick={handleAdd} disabled={adding}>
          {adding ? <Spinner size="1" /> : <><Plus size={14} /> Agregar</>}
        </Button>
      </Flex>

      {platillos.length === 0 ? (
        <Text color="gray" size="2">No hay platillos configurados</Text>
      ) : (
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Platillo</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Precio</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Tiempo</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Stock</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Activo</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {platillos.map((p) => (
              <Table.Row key={p.id}>
                <Table.Cell>{p.platillo}</Table.Cell>
                <Table.Cell>${p.precio.toFixed(2)}</Table.Cell>
                <Table.Cell>
                  <Badge color="orange" variant="soft" size="1">
                    {getTiempoNombre(p.tiempo_id)}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {savingStockId === p.id ? (
                    <Spinner size="1" />
                  ) : (
                    <TextField.Root
                      type="number"
                      min="0"
                      placeholder="∞"
                      value={stockEdits[p.id] ?? ""}
                      onChange={(e) =>
                        setStockEdits((prev) => ({ ...prev, [p.id]: e.target.value }))
                      }
                      onBlur={() => handleStockBlur(p)}
                      style={{ width: 70 }}
                    />
                  )}
                </Table.Cell>
                <Table.Cell>
                  {togglingId === p.id ? (
                    <Spinner size="1" />
                  ) : (
                    <Switch
                      checked={p.activo}
                      onCheckedChange={() => handleToggle(p)}
                    />
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Flex>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function KitchenManagementModal({ open, onClose }: KitchenManagementModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Content
        style={{ maxWidth: 680, maxHeight: "85vh", overflow: "auto", borderRadius: 16 }}
      >
        <Flex justify="between" align="center" mb="4">
          <Dialog.Title>Gestión de Cocina</Dialog.Title>
          <Button variant="ghost" color="gray" onClick={onClose}>
            <X size={18} />
          </Button>
        </Flex>

        <Tabs.Root defaultValue="config">
          <Tabs.List mb="4">
            <Tabs.Trigger value="config">Configuración</Tabs.Trigger>
            <Tabs.Trigger value="tiempos">Tiempos</Tabs.Trigger>
            <Tabs.Trigger value="platillos">Platillos</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="config">
            <ConfigTab />
          </Tabs.Content>
          <Tabs.Content value="tiempos">
            <TiemposTab />
          </Tabs.Content>
          <Tabs.Content value="platillos">
            <PlatillosTab />
          </Tabs.Content>
        </Tabs.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}
