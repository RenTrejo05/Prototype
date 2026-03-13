"use client";

import { useEffect, useState } from "react";
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
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useTheme } from "next-themes";

import { ThemeSwitch } from "@/components/theme-switch";
import { useAuth } from "@/contexts/AuthContext";

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-2" href="/">
            {isMounted ? (
              <Image
                alt="SIPS logo"
                height={50}
                src={resolvedTheme === "dark" ? "/sips-logo-dark.svg" : "/sips-logo.svg"}
                width={50}
              />
            ) : (
              <div style={{ width: 50, height: 50 }} />
            )}
            <p className="font-bold text-inherit">SIPS</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        {isMounted && isAuthenticated ? (
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
              {isMounted ? <ThemeSwitch /> : null}
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
        {isMounted ? <ThemeSwitch /> : null}
        {isMounted && isAuthenticated && <NavbarMenuToggle />}
      </NavbarContent>

      {isMounted && isAuthenticated && (
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
