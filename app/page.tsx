"use client";

import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { useEffect, useState } from "react";
import Link from "next/link";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardModules } from "@/config/dashboard";
import { ModuleIcon, LockIcon } from "@/components/module-icons";
import { title } from "@/components/primitives";
import { getInventoryApiUrl, getAlertsApiUrl } from "@/lib/api-clients";
import type { InventoryAnalytics, StoredAlert } from "@/types";

export default function Home() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [alertsCount, setAlertsCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const [analyticsRes, alertsRes] = await Promise.all([
          fetch(getInventoryApiUrl("/api/inventory/analytics")),
          fetch(getAlertsApiUrl("/api/alerts?limit=100")),
        ]);
        if (analyticsRes.ok) {
          const data: InventoryAnalytics = await analyticsRes.json();
          setAnalytics(data);
        }
        if (alertsRes.ok) {
          const alerts: StoredAlert[] = await alertsRes.json();
          setAlertsCount(alerts.length);
        }
      } catch {
        // ignore
      }
    };
    load();
  }, [user]);

  const modulesToShow = dashboardModules.filter(
    (m) => !m.role || user?.role === "admin",
  );

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-2 py-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={title()}>Dashboard</h1>
            <p className="text-default-500 mt-1">
              Hola, <strong>{user?.username}</strong>
            </p>
          </div>
          {alertsCount > 0 && (
            <Chip color="warning" size="sm" variant="flat">
              {alertsCount} alerta{alertsCount !== 1 ? "s" : ""}
            </Chip>
          )}
        </div>

        <div className="bg-default-50/50 dark:bg-default-100/30 rounded-lg">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {modulesToShow.map((module) => (
              <Link key={module.href} href={module.href} className="block">
                <Card
                  isPressable
                  className="h-full w-full border border-default-200/50 bg-default-50/80 dark:bg-default-100/40 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <CardBody className="flex flex-col items-center justify-center gap-3 p-6">
                    <div className="size-14 flex items-center justify-center text-default-600">
                      <ModuleIcon icon={module.icon} className="size-12" />
                    </div>
                    <div className="flex items-center gap-1.5 w-full justify-center">
                      <span className="font-medium text-default-800 text-center">
                        {module.label}
                      </span>
                      {module.role === "admin" && (
                        <LockIcon className="size-4 shrink-0 text-default-400" />
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-default-50/50 dark:bg-default-100/30 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/productos">
              <Card className="bg-default-100/80 h-full">
                <CardBody className="py-6 flex flex-col justify-center">
                  <p className="text-sm text-default-600">Productos</p>
                  <p className="text-2xl font-semibold">
                    {analytics?.totalProducts ?? "—"}
                  </p>
                </CardBody>
              </Card>
            </Link>
            <Link href="/inventario">
              <Card className="bg-default-100/80 h-full">
                <CardBody className="py-6 flex flex-col justify-center">
                  <p className="text-sm text-default-600">Unidades en stock</p>
                  <p className="text-2xl font-semibold">
                    {analytics?.totalStockUnits ?? "—"}
                  </p>
                </CardBody>
              </Card>
            </Link>
            <Link href="/inventario">
              <Card className="bg-default-100/80 h-full">
                <CardBody className="py-6 flex flex-col justify-center">
                  <p className="text-sm text-default-600">Valor inventario</p>
                  <p className="text-2xl font-semibold text-success">
                    {analytics != null
                      ? `$${analytics.totalStockValue.toLocaleString()}`
                      : "—"}
                  </p>
                </CardBody>
              </Card>
            </Link>
            <Link href="/inventario">
              <Card className="bg-default-100/80 h-full">
                <CardBody className="py-6 flex flex-col justify-center">
                  <p className="text-sm text-default-600">Alertas</p>
                  <p className="text-2xl font-semibold text-warning">
                    {analytics?.lowStockProducts?.length ?? 0}
                  </p>
                </CardBody>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
