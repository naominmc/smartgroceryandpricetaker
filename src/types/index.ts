export type ProductCategory =
  | 'Beras dan bahan pokok'
  | 'Sayur dan buah'
  | 'Daging dan protein'
  | 'Susu dan produk dingin'
  | 'Makanan instan'
  | 'Minuman'
  | 'Perlengkapan mandi'
  | 'Kebersihan rumah'
  | 'Kebutuhan kuliah'
  | 'Lainnya';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Beras dan bahan pokok',
  'Sayur dan buah',
  'Daging dan protein',
  'Susu dan produk dingin',
  'Makanan instan',
  'Minuman',
  'Perlengkapan mandi',
  'Kebersihan rumah',
  'Kebutuhan kuliah',
  'Lainnya',
];

export type ProductUnit =
  | 'pcs'
  | 'kg'
  | 'gram'
  | 'liter'
  | 'ml'
  | 'pack'
  | 'botol'
  | 'bungkus'
  | string;

export const STANDARD_UNITS: string[] = [
  'pcs',
  'kg',
  'gram',
  'liter',
  'ml',
  'pack',
  'botol',
  'bungkus',
  'custom',
];

export interface Product {
  id: string;
  name: string;
  normalizedName: string;
  category: ProductCategory;
  unit: string;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  nameSnapshot: string;
  categorySnapshot: ProductCategory;
  unit: string;
  quantity: number;
  unitPrice: number; // Rupiah integer
  discounts: number[]; // e.g. [25] or [50, 20]
  previousUnitPrice?: number | null;
  barcode?: string;
  status: 'active' | 'completed'; // active = in cart, completed = marked checked off
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  period: string; // YYYY-MM
  limit: number; // Rupiah integer
  createdAt: string;
  updatedAt: string;
}

export interface TransactionItemSnapshot {
  id: string;
  productId: string;
  nameSnapshot: string;
  categorySnapshot: ProductCategory;
  unit: string;
  quantity: number;
  unitPrice: number;
  discounts: number[];
  grossSubtotal: number;
  discountAmount: number;
  finalSubtotal: number;
  barcode?: string;
}

export interface PurchaseTransaction {
  id: string;
  period: string; // YYYY-MM
  purchasedAt: string; // ISO
  items: TransactionItemSnapshot[];
  grossTotal: number;
  discountTotal: number;
  finalTotal: number;
  budgetLimitSnapshot: number;
  paymentMethod?: string; // e.g. 'Bank BCA', 'Tunai', etc.
}

export type BudgetStatusLevel = 'safe' | 'warning' | 'danger' | 'exceeded';

export interface BudgetStatus {
  limit: number;
  activeTotal: number;
  remaining: number;
  percentage: number;
  level: BudgetStatusLevel;
  message: string;
  excessAmount: number;
  totalSavings: number;
}

export interface PriceComparisonResult {
  hasPreviousData: boolean;
  previousPrice?: number | null;
  currentPrice: number;
  difference: number;
  percentageChange: number;
  status: 'up' | 'down' | 'equal' | 'no_data';
}

export interface SupermarketCatalogItem {
  barcode: string;
  name: string;
  category: ProductCategory;
  unit: string;
  unitPrice: number;
  discounts?: number[];
  brand?: string;
  description?: string;
}

export interface PaymentAccount {
  id: string;
  name: string;
  type: 'bank' | 'ewallet' | 'cash';
  accountNumber?: string;
  color: string;
  badge: string;
}
