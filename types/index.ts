import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// Tipos de entidades
export type UserRole = "user" | "admin";

export interface User {
  id: number;
  username: string;
  password: string;
  role?: UserRole; // por defecto "user"; solo admin puede crear usuarios
}

export interface Project {
  id: number;
  name: string;
  description: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status:
    | "Pendiente"
    | "En Progreso"
    | "Completada"
    | "Bloqueada"
    | "Cancelada";
  priority: "Baja" | "Media" | "Alta" | "Crítica";
  projectId: number;
  assignedTo: number;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  taskId: number;
  userId: number;
  commentText: string;
  createdAt: string;
}

export interface HistoryEntry {
  id: number;
  taskId: number;
  userId: number;
  action:
    | "CREATED"
    | "STATUS_CHANGED"
    | "TITLE_CHANGED"
    | "DELETED"
    | "UPDATED";
  oldValue: string;
  newValue: string;
  timestamp: string;
}

export interface Notification {
  id: number;
  userId: number;
  message: string;
  type:
    | "task_assigned"
    | "task_updated"
    | "task_completed"
    | "comment_added"
    | "admin_alert";
  read: boolean;
  createdAt: string;
}

// Tipos para formularios
export interface TaskFormData {
  title: string;
  description: string;
  status: Task["status"];
  priority: Task["priority"];
  projectId: number;
  assignedTo: number;
  dueDate: string;
  estimatedHours: number;
}

export interface ProjectFormData {
  name: string;
  description: string;
}

export interface CommentFormData {
  taskId: number;
  commentText: string;
}

export interface SearchFilters {
  text: string;
  status: Task["status"] | "";
  priority: Task["priority"] | "";
  projectId: number;
}

// Inventario (APIs externas)
export interface Product {
  id: number;
  name: string;
  sku: string;
  category?: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: number;
  date: string;
  items: SaleItem[];
  total: number;
  note?: string;
}

export interface InventoryAnalytics {
  totalProducts: number;
  totalStockUnits: number;
  totalStockValue: number;
  lowStockProducts: Product[];
  suggestedRestocks: { product: Product; suggestedQty: number }[];
}

export interface StoredAlert {
  id: string;
  type: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
}
