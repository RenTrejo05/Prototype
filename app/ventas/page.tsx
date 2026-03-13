"use client";

import type { Product, Sale, SaleItem } from "@/types";
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

interface CartItem extends SaleItem {
  productName?: string;
}

export default function VentasPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(getInventoryApiUrl("/api/products")),
        fetch(getInventoryApiUrl("/api/sales")),
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (sRes.ok) setSales((await sRes.json()).slice(0, 50));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addToCart = () => {
    const id = Number(selectedProductId);
    if (!id || qty < 1) return;
    const product = products.find((p) => p.id === id);
    if (!product) return;
    if (product.stock < qty) {
      alert(`Stock insuficiente: ${product.stock} disponibles`);
      return;
    }
    setCart((prev) => [
      ...prev,
      {
        productId: id,
        quantity: qty,
        unitPrice: product.price,
        productName: product.name,
      },
    ]);
    setSelectedProductId("");
    setQty(1);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const total = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const registerSale = async () => {
    if (cart.length === 0) {
      alert("Agrega al menos un producto");
      return;
    }
    const items: SaleItem[] = cart.map(({ productId, quantity, unitPrice }) => ({
      productId,
      quantity,
      unitPrice,
    }));
    try {
      const res = await fetch(getInventoryApiUrl("/api/sales"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, note: note || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Error al registrar venta");
        return;
      }
      setCart([]);
      setNote("");
      await load();
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6">
        <h1 className={title()}>Ventas</h1>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Nueva venta</h2>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap items-end gap-4">
              <Select
                label="Producto"
                placeholder="Seleccionar"
                selectedKeys={selectedProductId ? [selectedProductId] : []}
                onSelectionChange={(k) =>
                  setSelectedProductId(Array.from(k)[0] as string ?? "")
                }
                className="max-w-xs"
                variant="bordered"
              >
                {products.filter((p) => p.active).map((p) => (
                  <SelectItem key={String(p.id)}>
                    {p.name} (stock: {p.stock}) - ${p.price}
                  </SelectItem>
                ))}
              </Select>
              <Input
                type="number"
                label="Cantidad"
                value={String(qty)}
                onValueChange={(v) => setQty(Number(v) || 1)}
                className="w-24"
                variant="bordered"
                min={1}
              />
              <Button color="primary" onPress={addToCart}>
                Agregar
              </Button>
            </div>
            {cart.length > 0 && (
              <>
                <div className="mt-4">
                  <Table aria-label="Carrito">
                    <TableHeader>
                      <TableColumn>Producto</TableColumn>
                      <TableColumn>Cantidad</TableColumn>
                      <TableColumn>P. unit.</TableColumn>
                      <TableColumn>Subtotal</TableColumn>
                      <TableColumn width={80} />
                    </TableHeader>
                    <TableBody>
                      {cart.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.unitPrice}</TableCell>
                          <TableCell>
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              color="danger"
                              variant="light"
                              onPress={() => removeFromCart(i)}
                            >
                              Quitar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="mt-2 font-semibold">Total: ${total.toFixed(2)}</p>
                <Input
                  label="Nota (opcional)"
                  value={note}
                  onValueChange={setNote}
                  className="max-w-md mt-2"
                  variant="bordered"
                />
                <Button
                  color="success"
                  className="mt-2"
                  onPress={registerSale}
                >
                  Registrar venta
                </Button>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Ventas recientes</h2>
          </CardHeader>
          <CardBody>
            <Table aria-label="Ventas">
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Fecha</TableColumn>
                <TableColumn>Total</TableColumn>
                <TableColumn>Nota</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={loading ? "Cargando…" : "No hay ventas"}
                isLoading={loading}
              >
                {sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.id}</TableCell>
                    <TableCell>
                      {new Date(s.date).toLocaleString()}
                    </TableCell>
                    <TableCell>${s.total.toFixed(2)}</TableCell>
                    <TableCell>{s.note ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
