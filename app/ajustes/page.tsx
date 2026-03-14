"use client";

import type {
  Product,
  InventoryAdjustment,
  AdjustmentType,
  AdjustmentReason,
} from "@/types";
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { title } from "@/components/primitives";
import { getInventoryApiUrl } from "@/lib/api-clients";
import { ConfirmModal } from "@/components/confirm-modal";

const REASON_OPTIONS: { value: AdjustmentReason; label: string }[] = [
  { value: "conteo_fisico", label: "Conteo físico" },
  { value: "dano", label: "Daño / merma" },
  { value: "uso_interno", label: "Uso interno" },
  { value: "transferencia", label: "Transferencia" },
  { value: "correccion", label: "Corrección de error" },
  { value: "otro", label: "Otro" },
];

const TYPE_OPTIONS: { value: AdjustmentType; label: string }[] = [
  { value: "increase", label: "Entrada (aumento)" },
  { value: "decrease", label: "Salida (disminución)" },
];

export default function AjustesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [type, setType] = useState<AdjustmentType>("increase");
  const [reason, setReason] = useState<AdjustmentReason>("conteo_fisico");
  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [referenceDocument, setReferenceDocument] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertModal, setAlertModal] = useState({ open: false, title: "", message: "" });

  const showAlert = (message: string, title = "Aviso") =>
    setAlertModal({ open: true, title, message });

  const load = async () => {
    try {
      const [pRes, aRes] = await Promise.all([
        fetch(getInventoryApiUrl("/api/products")),
        fetch(getInventoryApiUrl("/api/adjustments")),
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (aRes.ok) setAdjustments((await aRes.json()).slice(0, 50));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const productMap = new Map(products.map((p) => [p.id, p]));

  const registerAdjustment = async () => {
    const pid = Number(productId);
    if (!pid || quantity < 1) {
      showAlert("Selecciona un producto y una cantidad mayor a 0", "Datos requeridos");
      return;
    }
    const product = productMap.get(pid);
    if (!product) {
      showAlert("Producto no encontrado", "Error");
      return;
    }
    if (type === "decrease" && product.stock < quantity) {
      showAlert(
        `Stock insuficiente: ${product.name} tiene ${product.stock} unidades`,
        "Stock insuficiente",
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type,
        reason,
        productId: pid,
        quantity,
        referenceDocument: referenceDocument.trim() || undefined,
        note: note.trim() || undefined,
      };
      const res = await fetch(getInventoryApiUrl("/api/adjustments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showAlert(err.error ?? "Error al registrar ajuste", "Error");
        return;
      }
      setProductId("");
      setQuantity(1);
      setReferenceDocument("");
      setNote("");
      await load();
    } catch (e) {
      console.error(e);
      showAlert("Error de conexión", "Error");
    } finally {
      setSaving(false);
    }
  };

  const reasonLabel = (r: AdjustmentReason) => REASON_OPTIONS.find((o) => o.value === r)?.label ?? r;

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6">
        <h1 className={title()}>Ajustes de inventario</h1>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              Nuevo ajuste (justificar entrada o salida de material)
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipo de ajuste"
                placeholder="Seleccionar"
                selectedKeys={type ? new Set([type]) : new Set()}
                onSelectionChange={(keys) => {
                  if (keys === "all") {
                    setType("increase");
                    return;
                  }
                  const firstKey = keys.values().next().value;
                  setType((firstKey as AdjustmentType | undefined) ?? "increase");
                }}
                variant="bordered"
              >
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} textValue={o.label}>
                    {o.label}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Motivo"
                placeholder="Seleccionar"
                selectedKeys={reason ? new Set([reason]) : new Set()}
                onSelectionChange={(keys) => {
                  if (keys === "all") {
                    setReason("conteo_fisico");
                    return;
                  }
                  const firstKey = keys.values().next().value;
                  setReason((firstKey as AdjustmentReason | undefined) ?? "conteo_fisico");
                }}
                variant="bordered"
              >
                {REASON_OPTIONS.map((o) => (
                  <SelectItem key={o.value} textValue={o.label}>
                    {o.label}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Producto"
                placeholder="Seleccionar"
                selectedKeys={productId ? new Set([productId]) : new Set()}
                onSelectionChange={(keys) => {
                  if (keys === "all") {
                    setProductId("");
                    return;
                  }
                  const firstKey = keys.values().next().value;
                  setProductId(firstKey != null ? String(firstKey) : "");
                }}
                variant="bordered"
                className="md:col-span-2"
              >
                {products.filter((p) => p.active).map((p) => (
                  <SelectItem
                    key={String(p.id)}
                    textValue={p.name}
                  >
                    {`${p.name} — stock actual: ${p.stock}`}
                  </SelectItem>
                ))}
              </Select>
              <Input
                type="number"
                label="Cantidad"
                value={String(quantity)}
                onValueChange={(v) => setQuantity(Math.max(1, Number(v) || 1))}
                variant="bordered"
              />
              <Input
                label="Documento de referencia (opcional)"
                value={referenceDocument}
                onValueChange={setReferenceDocument}
                variant="bordered"
                placeholder="Ej. Acta, folio, ticket"
              />
              <Input
                label="Nota (opcional)"
                value={note}
                onValueChange={setNote}
                variant="bordered"
                className="md:col-span-2"
              />
            </div>
            <Button
              color="primary"
              className="mt-4"
              onPress={registerAdjustment}
              isLoading={saving}
            >
              Registrar ajuste
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Ajustes recientes</h2>
          </CardHeader>
          <CardBody>
            <Table aria-label="Ajustes">
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Fecha</TableColumn>
                <TableColumn>Tipo</TableColumn>
                <TableColumn>Motivo</TableColumn>
                <TableColumn>Producto</TableColumn>
                <TableColumn>Cantidad</TableColumn>
                <TableColumn>Ref.</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={loading ? "Cargando…" : "No hay ajustes"}
                isLoading={loading}
              >
                {adjustments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.id}</TableCell>
                    <TableCell>{new Date(a.date).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={a.type === "increase" ? "success" : "warning"}
                      >
                        {a.type === "increase" ? "Entrada" : "Salida"}
                      </Chip>
                    </TableCell>
                    <TableCell>{reasonLabel(a.reason)}</TableCell>
                    <TableCell>
                      {productMap.get(a.productId)?.name ?? `ID ${a.productId}`}
                    </TableCell>
                    <TableCell>{a.quantity}</TableCell>
                    <TableCell>{a.referenceDocument ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
      <ConfirmModal
        isOpen={alertModal.open}
        title={alertModal.title}
        message={alertModal.message}
        alertOnly
        onConfirm={() => {}}
        onClose={() => setAlertModal({ open: false, title: "", message: "" })}
      />
    </ProtectedRoute>
  );
}
