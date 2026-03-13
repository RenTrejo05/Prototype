"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { ThemeSwitch } from "@/components/theme-switch";
import { useAuth } from "@/contexts/AuthContext";

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <p className="font-bold text-inherit">Inventario</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        {isAuthenticated ? (
          <>
            <NavbarItem className="hidden sm:flex gap-2">
              <ThemeSwitch />
            </NavbarItem>
            <NavbarItem>
              <div className="flex items-center gap-2">
                <span className="text-sm text-default-600">
                  {user?.username}
                </span>
                <Button
                  color="danger"
                  size="sm"
                  variant="light"
                  onPress={handleLogout}
                >
                  Salir
                </Button>
              </div>
            </NavbarItem>
          </>
        ) : (
          <>
            <NavbarItem className="hidden sm:flex gap-2">
              <ThemeSwitch />
            </NavbarItem>
            <NavbarItem>
              <Button
                as={NextLink}
                color="primary"
                href="/login"
                variant="flat"
              >
                Iniciar Sesión
              </Button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        {isAuthenticated && <NavbarMenuToggle />}
      </NavbarContent>

      {isAuthenticated && (
        <NavbarMenu>
          <div className="mx-4 mt-2 flex flex-col gap-2">
            <NavbarMenuItem>
              <span className="text-default-600">{user?.username}</span>
            </NavbarMenuItem>
            <NavbarMenuItem>
              <Button
                color="danger"
                size="sm"
                variant="light"
                onPress={handleLogout}
                className="w-full justify-start"
              >
                Salir
              </Button>
            </NavbarMenuItem>
          </div>
        </NavbarMenu>
      )}
    </HeroUINavbar>
  );
};
