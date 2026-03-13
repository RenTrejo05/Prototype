export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "SIPS",
  description: "Sistema de inventario: productos, ventas, stock y alertas.",
  navItems: [
    { label: "Home", href: "/" },
    { label: "Productos", href: "/productos" },
    { label: "Ventas", href: "/ventas" },
    { label: "Inventario", href: "/inventario" },
    { label: "Usuarios", href: "/usuarios", role: "admin" as const },
  ],
  navMenuItems: [
    { label: "Logout", href: "/logout" },
  ],
};
