"use client";

import type { InventoryAnalytics, StoredAlert } from "@/types";
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { AlertTriangle, Package, TrendingUp, DollarSign } from "lucide-react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { title } from "@/components/primitives";
import { getInventoryApiUrl, getAlertsApiUrl } from "@/lib/api-clients";

export default function InventarioPage() {
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [alerts, setAlerts] = useState<StoredAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, alRes] = await Promise.all([
        fetch(getInventoryApiUrl("/api/inventory/analytics")),
        fetch(getAlertsApiUrl("/api/alerts?limit=100")),
      ]);
      if (aRes.ok) setAnalytics(await aRes.json());
      if (alRes.ok) setAlerts(await alRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading && !analytics) {
    return (
      <ProtectedRoute>
        <div className={title()}>Inventario y alertas</div>
        <p className="text-default-500">Cargando…</p>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className={title()}>Inventario y alertas</h1>
          <Button variant="flat" onPress={load}>
            Actualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-default-100/80">
            <CardBody className="flex flex-row items-center gap-3">
              <Package className="size-10 text-primary" />
              <div>
                <p className="text-sm text-default-600">Productos</p>
                <p className="text-2xl font-semibold">
                  {analytics?.totalProducts ?? "—"}
                </p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-default-100/80">
            <CardBody className="flex flex-row items-center gap-3">
              <TrendingUp className="size-10 text-success" />
              <div>
                <p className="text-sm text-default-600">Unidades en stock</p>
                <p className="text-2xl font-semibold">
                  {analytics?.totalStockUnits ?? "—"}
                </p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-default-100/80">
            <CardBody className="flex flex-row items-center gap-3">
              <DollarSign className="size-10 text-success" />
              <div>
                <p className="text-sm text-default-600">Valor inventario</p>
                <p className="text-2xl font-semibold">
                  {analytics != null
                    ? `$${analytics.totalStockValue.toLocaleString()}`
                    : "—"}
                </p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-default-100/80">
            <CardBody className="flex flex-row items-center gap-3">
              <AlertTriangle className="size-10 text-warning" />
              <div>
                <p className="text-sm text-default-600">Stock bajo</p>
                <p className="text-2xl font-semibold text-warning">
                  {analytics?.lowStockProducts?.length ?? 0}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {(analytics?.lowStockProducts?.length ?? 0) > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="size-5" />
                Productos con stock bajo
              </h2>
            </CardHeader>
            <CardBody>
              <ul className="flex flex-col gap-2">
                {analytics!.lowStockProducts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b border-default-200 last:border-0"
                  >
                    <span>
                      <strong>{p.name}</strong> (SKU: {p.sku}) — Stock:{" "}
                      {p.stock}, Mínimo: {p.minStock}
                    </span>
                    <Chip color="warning" size="sm" variant="flat">
                      Reponer
                    </Chip>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        {analytics?.suggestedRestocks && analytics.suggestedRestocks.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Sugerencias de reabastecimiento</h2>
            </CardHeader>
            <CardBody>
              <ul className="flex flex-col gap-2">
                {analytics.suggestedRestocks.map(({ product, suggestedQty }) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between py-2 border-b border-default-200 last:border-0"
                  >
                    <span>
                      {product.name} — sugerido: <strong>{suggestedQty} unidades</strong>
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Historial de alertas (desde el servicio de alertas)
            </h2>
          </CardHeader>
          <CardBody>
            {alerts.length === 0 ? (
              <p className="text-default-500">
                No hay alertas aún. Las alertas se generan cuando el Inventory API
                publica eventos (stock bajo, ventas) y el Alerts Service las procesa
                (endpoint /api/internal/process).
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {alerts.map((a) => (
                  <li
                    key={a.id}
                    className="p-3 rounded-lg bg-default-100 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <Chip size="sm" variant="flat">
                        {a.type}
                      </Chip>
                      <span className="text-xs text-default-500">
                        {new Date(a.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-default-800">{a.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
