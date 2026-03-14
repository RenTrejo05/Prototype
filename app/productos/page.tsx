"use client";

import type { Product } from "@/types";
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
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

const emptyProduct = (): Partial<Product> => ({
  name: "",
  sku: "",
  category: "",
  price: 0,
  cost: 0,
  stock: 0,
  minStock: 0,
  active: true,
});

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Product>>(emptyProduct());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  type ModalState = {
    open: boolean;
    title: string;
    message: string;
    alertOnly: boolean;
    confirmColor: "danger" | "warning" | "primary";
    onConfirm: () => void;
  };
  const closedModal: ModalState = {
    open: false, title: "", message: "", alertOnly: true,
    confirmColor: "primary", onConfirm: () => {},
  };
  const [modal, setModal] = useState<ModalState>(closedModal);

  const showAlert = (message: string, title = "Aviso") =>
    setModal({ open: true, title, message, alertOnly: true, confirmColor: "primary", onConfirm: () => {} });

  const showConfirm = (
    message: string,
    onConfirm: () => void,
    title = "Confirmar",
    confirmColor: "danger" | "warning" | "primary" = "danger",
  ) => setModal({ open: true, title, message, alertOnly: false, confirmColor, onConfirm });

  const load = async () => {
    try {
      const res = await fetch(getInventoryApiUrl("/api/products"));
      if (res.ok) setProducts(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const select = (p: Product) => {
    setSelectedId(p.id);
    setForm({
      name: p.name,
      sku: p.sku,
      category: p.category ?? "",
      price: p.price,
      cost: p.cost,
      stock: p.stock,
      minStock: p.minStock,
      active: p.active,
    });
  };

  const clearForm = () => {
    setSelectedId(null);
    setForm(emptyProduct());
  };

  const save = async () => {
    if (!form.name?.trim() || form.sku == null) {
      showAlert("Nombre y SKU son requeridos", "Campos requeridos");
      return;
    }
    try {
      const url = selectedId
        ? getInventoryApiUrl(`/api/products/${selectedId}`)
        : getInventoryApiUrl("/api/products");
      const method = selectedId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showAlert(err.error ?? "Error al guardar", "Error");
        return;
      }
      await load();
      clearForm();
    } catch (e) {
      console.error(e);
      showAlert("Error de conexión", "Error");
    }
  };

  const doRemove = async () => {
    try {
      const res = await fetch(getInventoryApiUrl(`/api/products/${selectedId}`), {
        method: "DELETE",
      });
      if (!res.ok) {
        showAlert("No se pudo eliminar", "Error");
        return;
      }
      await load();
      clearForm();
    } catch (e) {
      console.error(e);
      showAlert("Error de conexión", "Error");
    }
  };

  const remove = () => {
    if (!selectedId) return;
    showConfirm("¿Estás seguro de que deseas eliminar este producto?", doRemove, "Eliminar producto", "danger");
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (searchTerm.trim() === "") {
      load();
    }
  }, [searchTerm]);


  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6">
        <h1 className={title()}>Productos</h1>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {selectedId ? "Editar producto" : "Nuevo producto"}
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                value={form.name ?? ""}
                onValueChange={(v) => setForm({ ...form, name: v })}
                variant="bordered"
                isRequired
              />
              <Input
                label="SKU"
                value={form.sku ?? ""}
                onValueChange={(v) => setForm({ ...form, sku: v })}
                variant="bordered"
                isRequired
              />
              <Input
                label="Categoría"
                value={form.category ?? ""}
                onValueChange={(v) => setForm({ ...form, category: v })}
                variant="bordered"
              />
              <Input
                type="number"
                label="Precio venta"
                value={String(form.price ?? 0)}
                onValueChange={(v) => setForm({ ...form, price: Number(v) || 0 })}
                variant="bordered"
              />
              <Input
                type="number"
                label="Costo"
                value={String(form.cost ?? 0)}
                onValueChange={(v) => setForm({ ...form, cost: Number(v) || 0 })}
                variant="bordered"
              />
              <Input
                type="number"
                label="Stock"
                value={String(form.stock ?? 0)}
                onValueChange={(v) => setForm({ ...form, stock: Number(v) || 0 })}
                variant="bordered"
              />
              <Input
                type="number"
                label="Stock mínimo (alerta)"
                value={String(form.minStock ?? 0)}
                onValueChange={(v) => setForm({ ...form, minStock: Number(v) || 0 })}
                variant="bordered"
              />
              <div className="flex items-center gap-2">
                <Switch
                  isSelected={form.active !== false}
                  onValueChange={(v) => setForm({ ...form, active: v })}
                >
                  Activo
                </Switch>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button color="primary" onPress={save}>
                {selectedId ? "Actualizar" : "Crear"}
              </Button>
              {selectedId && (
                <Button color="danger" variant="flat" onPress={remove}>
                  Eliminar
                </Button>
              )}
              <Button variant="light" onPress={clearForm}>
                Limpiar
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Lista de productos</h2>
          </CardHeader>
          <CardBody>
            <Table aria-label="Productos" topContent={
              <Input
                placeholder="Buscar por nombre o SKU"
                onValueChange={(v) => setSearchTerm(v)}
              />
            }>
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Nombre</TableColumn>
                <TableColumn>SKU</TableColumn>
                <TableColumn>Precio</TableColumn>
                <TableColumn>Stock</TableColumn>
                <TableColumn>Mín.</TableColumn>
                <TableColumn>Estado</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={loading ? "Cargando…" : "No hay productos"}
                isLoading={loading}
              >
                {filteredProducts.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => select(p)}
                  >
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.sku}</TableCell>
                    <TableCell>${p.price}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>{p.minStock}</TableCell>
                    <TableCell>
                      {p.stock <= p.minStock ? (
                        <Chip color="warning" size="sm" variant="flat">
                          Bajo stock
                        </Chip>
                      ) : (
                        <Chip color="success" size="sm" variant="flat">
                          OK
                        </Chip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
        <ConfirmModal
          isOpen={modal.open}
          title={modal.title}
          message={modal.message}
          alertOnly={modal.alertOnly}
          confirmColor={modal.confirmColor}
          onConfirm={modal.onConfirm}
          onClose={() => setModal(closedModal)}
        />
      </ProtectedRoute>
  );
}
