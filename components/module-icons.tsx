"use client";

import type { DashboardModule } from "@/config/dashboard";
import {
  Home,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Truck,
  Scale,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<DashboardModule["icon"], LucideIcon> = {
  home: Home,
  productos: Package,
  ventas: ShoppingCart,
  inventario: BarChart3,
  recepcion: Truck,
  ajustes: Scale,
  usuarios: Users,
};

export function ModuleIcon({
  icon,
  className,
}: {
  icon: DashboardModule["icon"];
  className?: string;
}) {
  const Icon = iconMap[icon];
  return Icon ? <Icon className={className ?? "size-full"} /> : null;
}

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "size-4"}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}
