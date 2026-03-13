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
