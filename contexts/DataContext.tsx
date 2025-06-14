
import React, { createContext, useState, useContext, useCallback, ReactNode, useMemo } from 'react';
import { Project, Supplier, Customer, CashAccount, RevenueCategory, CostCenterNode, ExpenseEntry, RevenueEntry, Settlement, EntryStatus, LineItem, Product } from '../types';

// Define more precise argument types for addExpenseEntry and addRevenueEntry
type ExpenseEntryData = Omit<ExpenseEntry, 'id' | 'totalAmount' | 'settledAmount' | 'status' | 'lineItems'> & {
  lineItems: Array<Omit<LineItem, 'id'>>;
};

type RevenueEntryData = Omit<RevenueEntry, 'id' | 'totalAmount' | 'settledAmount' | 'status' | 'lineItems'> & {
  lineItems: Array<Omit<LineItem, 'id'>>;
};

interface DataContextState {
  projects: Project[];
  suppliers: Supplier[];
  customers: Customer[];
  cashAccounts: CashAccount[];
  revenueCategories: RevenueCategory[];
  costCenters: CostCenterNode[];
  products: Product[];
  expenseEntries: ExpenseEntry[];
  revenueEntries: RevenueEntry[];
  settlements: Settlement[];
}

interface DataContextActions {
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;

  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;

  addCashAccount: (account: Omit<CashAccount, 'id'>) => void;
  updateCashAccount: (account: CashAccount) => void;
  deleteCashAccount: (accountId: string) => void;

  addRevenueCategory: (category: Omit<RevenueCategory, 'id'>) => void;
  updateRevenueCategory: (category: RevenueCategory) => void;
  deleteRevenueCategory: (categoryId: string) => void;

  addCostCenterNode: (name: string, parentId: string | null) => CostCenterNode;
  updateCostCenterNode: (id: string, newName: string, isLaunchable: boolean) => void;
  deleteCostCenterNode: (id: string) => void;
  getCostCenterPath: (id: string | null) => string;

  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;

  addExpenseEntry: (entry: ExpenseEntryData) => void; // Updated type
  updateExpenseEntry: (entry: ExpenseEntry) => void; 
  
  addRevenueEntry: (entry: RevenueEntryData) => void; // Updated type
  updateRevenueEntry: (entry: RevenueEntry) => void;

  addSettlement: (settlement: Omit<Settlement, 'id'>) => void;
}

const initialCostCenters: CostCenterNode[] = [
  { id: '1', name: 'Geral & Administrativo', parentId: null, children: [
    { id: '1-1', name: 'Salários', parentId: '1', children: [], isLaunchable: true },
    { id: '1-2', name: 'Aluguel Escritório', parentId: '1', children: [], isLaunchable: true },
  ], isLaunchable: false},
  { id: '2', name: 'Custos de Construção', parentId: null, children: [
    { id: '2-1', name: 'Materiais', parentId: '2', children: [
      { id: '2-1-1', name: 'Cimento', parentId: '2-1', children: [], isLaunchable: true },
      { id: '2-1-2', name: 'Aço', parentId: '2-1', children: [], isLaunchable: true },
    ], isLaunchable: false},
    { id: '2-2', name: 'Mão de Obra', parentId: '2', children: [], isLaunchable: true },
    { id: '2-3', name: 'Aluguel de Equipamentos', parentId: '2', children: [], isLaunchable: true },
  ], isLaunchable: false},
];


const DataContext = createContext<(DataContextState & DataContextActions) | undefined>(undefined);

export const DataProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([
    {id: 'p1', name: 'Sky Tower Residencial', address: 'Rua Principal, 123', startDate: new Date().toISOString()},
    {id: 'p2', name: 'Complexo de Escritórios Central', address: 'Avenida Carvalho, 456', startDate: new Date().toISOString()},
  ]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {id: 's1', name: 'Global Materiais de Construção', email: 'vendas@global.com'},
    {id: 's2', name: 'Aluguel de Maquinário Pesado Inc.', email: 'aluguel@hmr.com'},
  ]);
  const [customers, setCustomers] = useState<Customer[]>([
    {id: 'c1', name: 'Futuros Compradores de Imóveis LLC', email: 'contato@fcimoveis.com'},
    {id: 'c2', name: 'Imobiliária Comercial Prime', email: 'info@icprime.com'},
  ]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([
    {id: 'ca1', name: 'Conta Banco Principal', bank: 'Banco Alfa', agency: '001', accountNumber: '12345-6', balance: 100000},
    {id: 'ca2', name: 'Caixa Pequeno', balance: 5000},
  ]);
  const [revenueCategories, setRevenueCategories] = useState<RevenueCategory[]>([
    {id: 'rc1', name: 'Venda de Unidade'},
    {id: 'rc2', name: 'Taxa de Serviço'},
  ]);
  const [costCenters, setCostCenters] = useState<CostCenterNode[]>(initialCostCenters);
  const [products, setProducts] = useState<Product[]>([
    {id: 'prod1', name: 'Cimento CPII (saco 50kg)', unit: 'sc'},
    {id: 'prod2', name: 'Areia Média Lavada', unit: 'm³'},
    {id: 'prod3', name: 'Brita 1', unit: 'm³'},
    {id: 'prod4', name: 'Vergalhão CA50 10mm (barra 12m)', unit: 'br'},
  ]);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const generateId = () => crypto.randomUUID();

  // CRUD Operations
  const crudOperations = <T extends { id: string }>(
    items: T[], 
    setItems: React.Dispatch<React.SetStateAction<T[]>>
  ) => ({
    add: (item: Omit<T, 'id'>) => {
      const newItem = { ...item, id: generateId() } as T;
      setItems(prev => [...prev, newItem]);
      return newItem;
    },
    update: (updatedItem: T) => {
      setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    },
    delete: (id: string) => {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  });

  const projectOps = crudOperations(projects, setProjects);
  const supplierOps = crudOperations(suppliers, setSuppliers);
  const customerOps = crudOperations(customers, setCustomers);
  const cashAccountOps = crudOperations(cashAccounts, setCashAccounts);
  const revenueCategoryOps = crudOperations(revenueCategories, setRevenueCategories);
  const productOps = crudOperations(products, setProducts);

  const addCostCenterNode = useCallback((name: string, parentId: string | null): CostCenterNode => {
    const newNode: CostCenterNode = { 
      id: generateId(), 
      name, 
      parentId, 
      children: [], 
      isLaunchable: true // New nodes default to launchable
    };
    setCostCenters(prev => {
      const updateChildren = (nodes: CostCenterNode[]): CostCenterNode[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            // If parent was launchable, it might make sense to set it to non-launchable now it has children.
            // For now, we leave this to manual user management.
            return { ...node, children: [...node.children, newNode] };
          }
          if (node.children.length > 0) {
            return { ...node, children: updateChildren(node.children) };
          }
          return node;
        });
      };
      if (parentId === null) {
        return [...prev, newNode];
      }
      return updateChildren(prev);
    });
    return newNode;
  }, []);

  const updateCostCenterNode = useCallback((id: string, newName: string, isLaunchable: boolean) => {
    setCostCenters(prev => {
      const updateNode = (nodes: CostCenterNode[]): CostCenterNode[] => {
        return nodes.map(node => {
          if (node.id === id) {
            return { ...node, name: newName, isLaunchable: isLaunchable };
          }
          if (node.children.length > 0) {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });
      };
      return updateNode(prev);
    });
  }, []);

  const deleteCostCenterNode = useCallback((id: string) => {
    setCostCenters(prev => {
      const removeNode = (nodes: CostCenterNode[]): CostCenterNode[] => {
        return nodes.filter(node => node.id !== id).map(node => ({
          ...node,
          children: node.children.length > 0 ? removeNode(node.children) : []
        }));
      };
      return removeNode(prev);
    });
  }, []);

  const getCostCenterPath = useCallback((id: string | null): string => {
    if (!id) return '';
    let path = '';
    const findNodeAndPath = (nodes: CostCenterNode[], currentId: string, currentPath: string[]): boolean => {
      for (const node of nodes) {
        if (node.id === currentId) {
          path = [...currentPath, node.name].join(' / ');
          return true;
        }
        if (node.children.length > 0) {
          if (findNodeAndPath(node.children, currentId, [...currentPath, node.name])) {
            return true;
          }
        }
      }
      return false;
    };
    findNodeAndPath(costCenters, id, []);
    return path;
  }, [costCenters]);

  const addExpenseEntry = useCallback((entryData: ExpenseEntryData) => { // Updated type
    const processedLineItems: LineItem[] = entryData.lineItems.map(li => ({
        ...li,
        id: generateId(),
        amount: (li.quantity && li.unitPrice) ? li.quantity * li.unitPrice : li.amount // Ensure amount is calculated if possible
    }));
    const totalAmount = processedLineItems.reduce((sum, item) => sum + item.amount, 0);
    const newEntry: ExpenseEntry = {
      ...entryData,
      id: generateId(),
      totalAmount,
      settledAmount: 0,
      status: EntryStatus.UNPAID,
      lineItems: processedLineItems
    };
    setExpenseEntries(prev => [...prev, newEntry]);
  }, []);
  
  const updateExpenseEntry = useCallback((updatedEntry: ExpenseEntry) => {
    // Recalculate totalAmount if line items were part of the update.
    const processedLineItems = updatedEntry.lineItems.map(li => ({
        ...li,
        amount: (li.quantity && li.unitPrice) ? li.quantity * li.unitPrice : li.amount
    }));
    const totalAmount = processedLineItems.reduce((sum, item) => sum + item.amount, 0);
    const entryWithRecalculatedTotal = { ...updatedEntry, lineItems: processedLineItems, totalAmount };
    setExpenseEntries(prev => prev.map(e => e.id === updatedEntry.id ? entryWithRecalculatedTotal : e));
  }, []);

  const addRevenueEntry = useCallback((entryData: RevenueEntryData) => { // Updated type
    const processedLineItems: LineItem[] = entryData.lineItems.map(li => ({
        ...li, 
        id: generateId()
    }));
    const totalAmount = processedLineItems.reduce((sum, item) => sum + item.amount, 0);
    const newEntry: RevenueEntry = {
      ...entryData,
      id: generateId(),
      totalAmount,
      settledAmount: 0,
      status: EntryStatus.UNRECEIVED,
      lineItems: processedLineItems
    };
    setRevenueEntries(prev => [...prev, newEntry]);
  }, []);

  const updateRevenueEntry = useCallback((updatedEntry: RevenueEntry) => {
     // Recalculate totalAmount if line items were part of the update.
    const totalAmount = updatedEntry.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const entryWithRecalculatedTotal = { ...updatedEntry, totalAmount };
    setRevenueEntries(prev => prev.map(e => e.id === updatedEntry.id ? entryWithRecalculatedTotal : e));
  }, []);

  const addSettlement = useCallback((settlementData: Omit<Settlement, 'id'>) => {
    const newSettlement: Settlement = { ...settlementData, id: generateId() };
    setSettlements(prev => [...prev, newSettlement]);

    if (settlementData.entryCategory === 'expense') {
      setExpenseEntries(prevEntries => prevEntries.map(entry => {
        if (entry.id === settlementData.entryId) {
          const newSettledAmount = entry.settledAmount + settlementData.amount;
          let newStatus = entry.status;
          if (newSettledAmount >= entry.totalAmount) {
            newStatus = EntryStatus.PAID;
          } else if (newSettledAmount > 0) {
            newStatus = EntryStatus.PARTIALLY_PAID;
          }
          return { ...entry, settledAmount: newSettledAmount, status: newStatus };
        }
        return entry;
      }));
    } else { // revenue
        setRevenueEntries(prevEntries => prevEntries.map(entry => {
        if (entry.id === settlementData.entryId) {
          const newSettledAmount = entry.settledAmount + settlementData.amount;
          let newStatus = entry.status;
          if (newSettledAmount >= entry.totalAmount) {
            newStatus = EntryStatus.RECEIVED;
          } else if (newSettledAmount > 0) {
            newStatus = EntryStatus.PARTIALLY_RECEIVED;
          }
          return { ...entry, settledAmount: newSettledAmount, status: newStatus };
        }
        return entry;
      }));
    }
  }, []);

  const value = useMemo(() => ({
    projects, suppliers, customers, cashAccounts, revenueCategories, costCenters, products, expenseEntries, revenueEntries, settlements,
    addProject: projectOps.add, updateProject: projectOps.update, deleteProject: projectOps.delete,
    addSupplier: supplierOps.add, updateSupplier: supplierOps.update, deleteSupplier: supplierOps.delete,
    addCustomer: customerOps.add, updateCustomer: customerOps.update, deleteCustomer: customerOps.delete,
    addCashAccount: cashAccountOps.add, updateCashAccount: cashAccountOps.update, deleteCashAccount: cashAccountOps.delete,
    addRevenueCategory: revenueCategoryOps.add, updateRevenueCategory: revenueCategoryOps.update, deleteRevenueCategory: revenueCategoryOps.delete,
    addProduct: productOps.add, updateProduct: productOps.update, deleteProduct: productOps.delete,
    addCostCenterNode, updateCostCenterNode, deleteCostCenterNode, getCostCenterPath,
    addExpenseEntry, updateExpenseEntry, addRevenueEntry, updateRevenueEntry, addSettlement
  }), [
    projects, suppliers, customers, cashAccounts, revenueCategories, costCenters, products, expenseEntries, revenueEntries, settlements,
    projectOps, supplierOps, customerOps, cashAccountOps, revenueCategoryOps, productOps,
    addCostCenterNode, updateCostCenterNode, deleteCostCenterNode, getCostCenterPath,
    addExpenseEntry, updateExpenseEntry, addRevenueEntry, updateRevenueEntry, addSettlement
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};