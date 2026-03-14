"use client";

import type { Product, GoodsReceipt, GoodsReceiptItem, ReceiptReferenceType } from "@/types";
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

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { title } from "@/components/primitives";
import { getInventoryApiUrl } from "@/lib/api-clients";
import { ConfirmModal } from "@/components/confirm-modal";

const REFERENCE_OPTIONS: { value: ReceiptReferenceType; label: string }[] = [
  { value: "invoice", label: "Factura" },
  { value: "purchase_order", label: "Orden de compra" },
];

interface CartReceiptItem extends GoodsReceiptItem {
  productName?: string;
}

export default function RecepcionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [referenceType, setReferenceType] = useState<ReceiptReferenceType>("invoice");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<CartReceiptItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [unitCost, setUnitCost] = useState("");
  const [itemNote, setItemNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertModal, setAlertModal] = useState({ open: false, title: "", message: "" });

  const showAlert = (message: string, title = "Aviso") =>
    setAlertModal({ open: true, title, message });

  const load = async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        fetch(getInventoryApiUrl("/api/products")),
        fetch(getInventoryApiUrl("/api/receipts")),
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (rRes.ok) setReceipts((await rRes.json()).slice(0, 50));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addItem = () => {
    const id = Number(selectedProductId);
    if (!id || qty < 1) return;
    const product = products.find((p) => p.id === id);
    if (!product) return;
    if (items.some((i) => i.productId === id)) {
      showAlert("Ese producto ya está en la lista. Edita la cantidad si hace falta.", "Producto duplicado");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        productId: id,
        quantity: qty,
        unitCost: unitCost ? Number(unitCost) : undefined,
        note: itemNote || undefined,
        productName: product.name,
      },
    ]);
    setSelectedProductId("");
    setQty(1);
    setUnitCost("");
    setItemNote("");
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const registerReceipt = async () => {
    if (!referenceNumber.trim()) {
      showAlert("Indica el número de factura u orden de compra", "Campo requerido");
      return;
    }
    if (items.length === 0) {
      showAlert("Agrega al menos un producto", "Sin ítems");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        referenceType,
        referenceNumber: referenceNumber.trim(),
        supplier: supplier.trim() || undefined,
        note: note.trim() || undefined,
        items: items.map(({ productId, quantity, unitCost, note: n }) => ({
          productId,
          quantity,
          unitCost: unitCost ?? undefined,
          note: n,
        })),
      };
      const res = await fetch(getInventoryApiUrl("/api/receipts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showAlert(err.error ?? "Error al registrar recepción", "Error");
        return;
      }
      setReferenceNumber("");
      setSupplier("");
      setNote("");
      setItems([]);
      await load();
    } catch (e) {
      console.error(e);
      showAlert("Error de conexión", "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6">
        <h1 className={title()}>Recepción de mercancía</h1>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Nueva recepción (entrada por factura u orden de compra)</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipo de documento"
                placeholder="Seleccionar"
                selectedKeys={referenceType ? new Set([referenceType]) : new Set()}
                onSelectionChange={(keys) => {
                  if (keys === "all") {
                    setReferenceType("invoice");
                    return;
                  }
                  const firstKey = keys.values().next().value;
                  setReferenceType((firstKey as ReceiptReferenceType | undefined) ?? "invoice");
                }}
                variant="bordered"
              >
                {REFERENCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} textValue={o.label}>
                    {o.label}
                  </SelectItem>
                ))}
              </Select>
              <Input
                label={referenceType === "invoice" ? "Número de factura" : "Número de orden de compra"}
                value={referenceNumber}
                onValueChange={setReferenceNumber}
                variant="bordered"
                isRequired
              />
              <Input
                label="Proveedor (opcional)"
                value={supplier}
                onValueChange={setSupplier}
                variant="bordered"
                className="md:col-span-2"
              />
              <Input
                label="Nota general (opcional)"
                value={note}
                onValueChange={setNote}
                variant="bordered"
                className="md:col-span-2"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-4">
              <Select
                label="Producto"
                placeholder="Seleccionar"
                selectedKeys={selectedProductId ? new Set([selectedProductId]) : new Set()}
                onSelectionChange={(keys) => {
                  if (keys === "all") {
                    setSelectedProductId("");
                    return;
                  }
                  const firstKey = keys.values().next().value;
                  setSelectedProductId(firstKey != null ? String(firstKey) : "");
                }}
                className="max-w-xs"
                variant="bordered"
              >
                {products.filter((p) => p.active).map((p) => (
                  <SelectItem
                    key={String(p.id)}
                    textValue={p.name}
                  >
                    {`${p.name} (stock: ${p.stock}) — costo: $${p.cost}`}
                  </SelectItem>
                ))}
              </Select>
              <Input
                type="number"
                label="Cantidad"
                value={String(qty)}
                onValueChange={(v) => setQty(Math.max(1, Number(v) || 1))}
                className="w-24"
                variant="bordered"
              />
              <Input
                type="number"
                label="Costo unit. (opc.)"
                value={unitCost}
                onValueChange={setUnitCost}
                className="w-28"
                variant="bordered"
                placeholder="Actualiza costo"
              />
              <Input
                label="Nota ítem (opc.)"
                value={itemNote}
                onValueChange={setItemNote}
                className="max-w-xs"
                variant="bordered"
              />
              <Button color="primary" onPress={addItem}>
                Agregar
              </Button>
            </div>

            {items.length > 0 && (
              <>
                <div className="mt-4">
                  <Table aria-label="Ítems a recibir">
                    <TableHeader>
                      <TableColumn>Producto</TableColumn>
                      <TableColumn>Cantidad</TableColumn>
                      <TableColumn>Costo unit.</TableColumn>
                      <TableColumn>Nota</TableColumn>
                      <TableColumn width={80}>Acción</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {item.unitCost != null ? `$${item.unitCost}` : "—"}
                          </TableCell>
                          <TableCell>{item.note ?? "—"}</TableCell>
                          <TableCell>
                            <Button size="sm" color="danger" variant="light" onPress={() => removeItem(i)}>
                              Quitar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button
                  color="success"
                  className="mt-4"
                  onPress={registerReceipt}
                  isLoading={saving}
                >
                  Registrar recepción
                </Button>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Recepciones recientes</h2>
          </CardHeader>
          <CardBody>
            <Table aria-label="Recepciones">
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Fecha</TableColumn>
                <TableColumn>Tipo</TableColumn>
                <TableColumn>Número</TableColumn>
                <TableColumn>Proveedor</TableColumn>
                <TableColumn>Ítems</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={loading ? "Cargando…" : "No hay recepciones"}
                isLoading={loading}
              >
                {receipts.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{new Date(r.date).toLocaleString()}</TableCell>
                    <TableCell>
                      {r.referenceType === "invoice" ? "Factura" : "Orden de compra"}
                    </TableCell>
                    <TableCell>{r.referenceNumber}</TableCell>
                    <TableCell>{r.supplier ?? "—"}</TableCell>
                    <TableCell>{r.items.length}</TableCell>
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
