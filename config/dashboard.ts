export type DashboardModule = {
  label: string;
  href: string;
  icon: keyof typeof dashboardIcons;
  role?: "admin";
};

export const dashboardIcons = {
  home: "home",
  productos: "productos",
  ventas: "ventas",
  inventario: "inventario",
  usuarios: "usuarios",
} as const;

export const dashboardModules: DashboardModule[] = [
  { label: "Inicio", href: "/", icon: "home" },
  { label: "Productos", href: "/productos", icon: "productos" },
  { label: "Ventas", href: "/ventas", icon: "ventas" },
  { label: "Inventario y alertas", href: "/inventario", icon: "inventario" },
  { label: "Usuarios", href: "/usuarios", icon: "usuarios", role: "admin" },
];
