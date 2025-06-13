
export enum EntryType {
  ACCOUNTING = 'Contábil',
  FINANCIAL = 'Financeiro',
}

export enum TransactionType {
  PRODUCT = 'Produto',
  SERVICE = 'Serviço',
}

export enum EntryStatus {
  PENDING = 'Pendente',
  PARTIALLY_PAID = 'Parcialmente Pago/Recebido',
  PAID = 'Pago/Recebido',
}

export enum UnitOfMeasure {
  SQM = 'm²',
  KG = 'kg',
  UNIT = 'un',
  HOUR = 'hr',
  VB = 'vb', // Verba
  M3 = 'm³'
}

export interface LineItem {
  id: string; // Typically `li-${timestamp}`
  itemName: string;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
  unitPrice: number;
  totalValue: number; // quantity * unitPrice
}

export type ExpenseId = `EXP-${string}`;
export type RevenueId = `REV-${string}`;
export type SettlementId = `SET-${'P'|'R'}-${string}`;
export type ProjectId = `proj-${string}`;
export type SupplierId = `sup-${string}`;
export type CustomerId = `cust-${string}`;
export type CashAccountId = `ca-${string}`;
export type CostCenterId = `cc-${string}`;
export type RevenueCategoryId = `revcat-${string}`;


export interface BaseEntry {
  id: string; // ExpenseId or RevenueId
  entryType: EntryType;
  invoiceNumber?: string;
  projectId: ProjectId;
  issueDate: string; // YYYY-MM-DD
  description?: string;
  cashAccountId: CashAccountId; 
  costCenterId: CostCenterId | RevenueCategoryId; // Linked to CostCenter (for expenses) or RevenueCategory (for revenues)
  lineItems: LineItem[];
  totalAmount: number; // Sum of lineItems totalValue
  amountPaid: number;
  status: EntryStatus;
}

export interface ExpenseEntry extends BaseEntry {
  id: ExpenseId;
  supplierId: SupplierId;
  disbursementDate: string; // Expected payment date (Vencimento)
  transactionType: TransactionType;
  costCenterId: CostCenterId;
}

export interface RevenueEntry extends BaseEntry {
  id: RevenueId;
  customerId: CustomerId;
  expectedReceiptDate: string; // Expected receipt date
  relatedProductId?: string; // e.g., Apartment 101
  costCenterId: RevenueCategoryId; // For revenues, this links to RevenueCategory
}

export interface Settlement {
  id: SettlementId;
  entryId: ExpenseId | RevenueId; 
  settlementDate: string; // YYYY-MM-DD
  amountSettled: number;
  cashAccountId: CashAccountId;
  type: 'payment' | 'receipt';
}

export interface Project {
  id: ProjectId;
  name: string;
  description?: string;
  isUserManaged?: boolean;
}

export interface Supplier {
  id: SupplierId;
  name: string;
  contact?: string;
  isUserManaged?: boolean;
}

export interface Customer {
  id: CustomerId;
  name: string;
  contact?: string;
  isUserManaged?: boolean;
}

export interface CashAccount {
  id: CashAccountId;
  name: string; 
  isUserManaged?: boolean;
}

export interface CostCenter {
  id: CostCenterId;
  name: string;
  parentId: CostCenterId | null;
  path?: string; // For display, e.g., "Custos > Estrutura > Fundações". Generated dynamically.
  isProductLevel?: boolean; // True if it's a leaf node where expenses are booked
  children?: CostCenter[]; // For hierarchical structure, often populated dynamically
  isUserManaged?: boolean;
}

export interface RevenueCategory {
  id: RevenueCategoryId;
  name: string;
  isUserManaged?: boolean;
}

export interface FilterState {
  projectId?: ProjectId | string; // Allow string for initial empty filter
  cashAccountId?: CashAccountId | string;
  startDate?: string;
  endDate?: string;
}