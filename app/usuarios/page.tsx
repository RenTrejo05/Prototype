"use client";

import type { User, UserRole } from "@/types";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Chip } from "@heroui/chip";

import { useAuth } from "@/contexts/AuthContext";
import { title } from "@/components/primitives";

type UserSafe = Omit<User, "password"> & { role?: UserRole };

export default function UsuariosPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserSafe[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    if (currentUser.role !== "admin") {
      router.replace("/");
      return;
    }
    loadUsers();
  }, [authLoading, currentUser, router]);

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      setMessage({ type: "error", text: "Error al cargar usuarios" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!username.trim() || !password.trim()) {
      setMessage({ type: "error", text: "Usuario y contraseña son requeridos" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data?.error ?? "No se pudo crear el usuario",
        });
        return;
      }
      setMessage({ type: "success", text: "Usuario creado correctamente" });
      setUsername("");
      setPassword("");
      setRole("user");
      await loadUsers();
    } catch (e) {
      setMessage({ type: "error", text: "Error de conexión" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !currentUser) {
    return null;
  }

  if (currentUser.role !== "admin") {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <h1 className={title()}>Crear usuarios</h1>
      <p className="text-default-500 text-sm">
        Solo los administradores pueden crear y ver usuarios. Para dar rol admin a un usuario existente, edita el documento en MongoDB (campo <code className="bg-default-100 px-1 rounded">role: &quot;admin&quot;</code>).
      </p>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Nuevo usuario</h2>
        </CardHeader>
        <CardBody>
          <form className="flex flex-col gap-4 max-w-md" onSubmit={handleSubmit}>
            <Input
              isRequired
              label="Usuario"
              placeholder="Nombre de usuario"
              value={username}
              variant="bordered"
              onValueChange={setUsername}
            />
            <Input
              isRequired
              label="Contraseña"
              placeholder="Contraseña"
              type="password"
              value={password}
              variant="bordered"
              onValueChange={setPassword}
            />
            <Select
              label="Rol"
              placeholder="Seleccionar"
              selectedKeys={role ? new Set([role]) : new Set()}
              variant="bordered"
              onSelectionChange={(keys) => {
                const v = Array.from(keys)[0] as UserRole;
                if (v) setRole(v);
              }}
              items={[
                { key: "user", label: "Usuario" },
                { key: "admin", label: "Administrador" },
              ]}
            >
              {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
            </Select>
            {message && (
              <p
                className={
                  message.type === "success"
                    ? "text-success text-sm"
                    : "text-danger text-sm"
                }
              >
                {message.text}
              </p>
            )}
            <Button
              type="submit"
              color="primary"
              isLoading={isSubmitting}
            >
              Crear usuario
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Usuarios existentes</h2>
        </CardHeader>
        <CardBody>
          <Table aria-label="Lista de usuarios">
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>Usuario</TableColumn>
              <TableColumn>Rol</TableColumn>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={u.role === "admin" ? "primary" : "default"}
                      variant="flat"
                    >
                      {u.role === "admin" ? "Admin" : "Usuario"}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
