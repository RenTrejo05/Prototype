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

// Recepción de mercancía (entrada por factura y/o orden de compra)
export type ReceiptReferenceType = "invoice" | "purchase_order";

export interface GoodsReceiptItem {
  productId: number;
  quantity: number;
  unitCost?: number;
  note?: string;
}

export interface GoodsReceipt {
  id: number;
  date: string;
  referenceType: ReceiptReferenceType;
  referenceNumber: string;
  supplier?: string;
  items: GoodsReceiptItem[];
  note?: string;
  createdAt: string;
}

// Ajustes de inventario (justificación de entradas/salidas)
export type AdjustmentReason =
  | "conteo_fisico"
  | "dano"
  | "uso_interno"
  | "transferencia"
  | "correccion"
  | "otro";

export type AdjustmentType = "increase" | "decrease";

export interface InventoryAdjustment {
  id: number;
  date: string;
  type: AdjustmentType;
  reason: AdjustmentReason;
  productId: number;
  quantity: number;
  referenceDocument?: string;
  note?: string;
  createdAt: string;
}
