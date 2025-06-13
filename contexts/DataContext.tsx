import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  ExpenseEntry, RevenueEntry, Settlement, Project, Supplier, Customer, CashAccount, CostCenter, RevenueCategory, 
  CostCenterId, ProjectId, SupplierId, CustomerId, CashAccountId, RevenueCategoryId, ExpenseId, RevenueId, SettlementId, EntryStatus
} from '../types';
import { 
  INITIAL_PROJECTS, INITIAL_SUPPLIERS, INITIAL_CUSTOMERS, INITIAL_CASH_ACCOUNTS, INITIAL_COST_CENTERS, INITIAL_REVENUE_CATEGORIES 
} from '../constants';

interface AppState {
  projects: Project[];
  suppliers: Supplier[];
  customers: Customer[];
  cashAccounts: CashAccount[];
  costCenters: CostCenter[]; // Stored as a flat list, hierarchy managed by parentId
  revenueCategories: RevenueCategory[];
  expenseEntries: ExpenseEntry[];
  revenueEntries: RevenueEntry[];
  settlements: Settlement[];
  nextExpenseId: number;
  nextRevenueId: number;
  nextSettlementId: number;
  nextProjectId: number;
  nextSupplierId: number;
  nextCustomerId: number;
  nextCashAccountId: number;
  nextCostCenterId: number;
  nextRevenueCategoryId: number;
  nextGenericItemId: number; // For line items etc.
}

type Action =
  | { type: 'ADD_EXPENSE_ENTRY'; payload: ExpenseEntry }
  | { type: 'ADD_REVENUE_ENTRY'; payload: RevenueEntry }
  | { type: 'ADD_SETTLEMENT'; payload: Settlement }
  | { type: 'UPDATE_EXPENSE_ENTRY'; payload: ExpenseEntry }
  | { type: 'UPDATE_REVENUE_ENTRY'; payload: RevenueEntry }
  | { type: 'ADD_COST_CENTER'; payload: CostCenter }
  | { type: 'UPDATE_COST_CENTER'; payload: CostCenter }
  | { type: 'DELETE_COST_CENTER'; payload: CostCenterId }
  // TODO: Add actions for Project, Supplier, Customer, CashAccount, RevenueCategory
  | { type: 'LOAD_DATA'; payload: AppState };

const initialState: AppState = {
  projects: INITIAL_PROJECTS,
  suppliers: INITIAL_SUPPLIERS,
  customers: INITIAL_CUSTOMERS,
  cashAccounts: INITIAL_CASH_ACCOUNTS,
  costCenters: INITIAL_COST_CENTERS.reduce((acc: CostCenter[], cc: CostCenter) => { 
    const collectChildren = (center: CostCenter, parentId: CostCenterId | null = null): CostCenter[] => {
        const { children: originalChildren, ...nodeData } = center; 
        const currentFlatNode: CostCenter = {
             ...nodeData, 
             parentId: parentId,
        };
        let result: CostCenter[] = [currentFlatNode];
        if (originalChildren) {
            originalChildren.forEach(child => {
                result = [...result, ...collectChildren(child, center.id)];
            });
        }
        return result;
    };
    return [...acc, ...collectChildren(cc)]; // Use spread syntax for concatenation
  }, [] as CostCenter[]),
  revenueCategories: INITIAL_REVENUE_CATEGORIES,
  expenseEntries: [],
  revenueEntries: [],
  settlements: [],
  nextExpenseId: 1,
  nextRevenueId: 1,
  nextSettlementId: 1,
  nextProjectId: (INITIAL_PROJECTS.length || 0) + 1,
  nextSupplierId: (INITIAL_SUPPLIERS.length || 0) + 1,
  nextCustomerId: (INITIAL_CUSTOMERS.length || 0) + 1,
  nextCashAccountId: (INITIAL_CASH_ACCOUNTS.length || 0) + 1,
  nextCostCenterId: 200, 
  nextRevenueCategoryId: (INITIAL_REVENUE_CATEGORIES.length || 0) + 1,
  nextGenericItemId: 1,
};

const dataReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOAD_DATA':
      return action.payload;
    case 'ADD_EXPENSE_ENTRY':
      return { 
        ...state, 
        expenseEntries: [...state.expenseEntries, action.payload],
        nextExpenseId: state.nextExpenseId + 1
      };
    case 'ADD_REVENUE_ENTRY':
      return { 
        ...state, 
        revenueEntries: [...state.revenueEntries, action.payload],
        nextRevenueId: state.nextRevenueId + 1 
      };
    case 'ADD_SETTLEMENT': {
      const settlement = action.payload;
      let updatedExpenseEntries = state.expenseEntries;
      let updatedRevenueEntries = state.revenueEntries;

      if (settlement.type === 'payment') {
        updatedExpenseEntries = state.expenseEntries.map(exp => {
          if (exp.id === settlement.entryId) {
            const newAmountPaid = exp.amountPaid + settlement.amountSettled;
            let newStatus = exp.status;
            if (newAmountPaid >= exp.totalAmount) newStatus = EntryStatus.PAID;
            else if (newAmountPaid > 0) newStatus = EntryStatus.PARTIALLY_PAID;
            else newStatus = EntryStatus.PENDING;
            return { ...exp, amountPaid: newAmountPaid, status: newStatus };
          }
          return exp;
        });
      } else { // receipt
        updatedRevenueEntries = state.revenueEntries.map(rev => {
          if (rev.id === settlement.entryId) {
            const newAmountPaid = rev.amountPaid + settlement.amountSettled;
            let newStatus = rev.status;
            if (newAmountPaid >= rev.totalAmount) newStatus = EntryStatus.PAID;
            else if (newAmountPaid > 0) newStatus = EntryStatus.PARTIALLY_PAID;
            else newStatus = EntryStatus.PENDING;
            return { ...rev, amountPaid: newAmountPaid, status: newStatus };
          }
          return rev;
        });
      }
      return { 
        ...state, 
        settlements: [...state.settlements, settlement],
        expenseEntries: updatedExpenseEntries,
        revenueEntries: updatedRevenueEntries,
        nextSettlementId: state.nextSettlementId + 1
      };
    }
    case 'UPDATE_EXPENSE_ENTRY': {
      return {
        ...state,
        expenseEntries: state.expenseEntries.map(e => e.id === action.payload.id ? action.payload : e)
      };
    }
    case 'UPDATE_REVENUE_ENTRY': {
      return {
        ...state,
        revenueEntries: state.revenueEntries.map(r => r.id === action.payload.id ? action.payload : r)
      };
    }
    case 'ADD_COST_CENTER':
      return {
        ...state,
        costCenters: [...state.costCenters, { ...action.payload, isUserManaged: true }],
        nextCostCenterId: state.nextCostCenterId + 1,
      };
    case 'UPDATE_COST_CENTER':
      return {
        ...state,
        costCenters: state.costCenters.map(cc =>
          cc.id === action.payload.id ? { ...action.payload, isUserManaged: true } : cc
        ),
      };
    case 'DELETE_COST_CENTER': {
      // Recursively find all children IDs to delete them as well
      const idsToDelete = new Set<CostCenterId>();
      idsToDelete.add(action.payload);
      
      let currentIdsToCheck = [action.payload];
      while(currentIdsToCheck.length > 0) {
        const parentId = currentIdsToCheck.pop()!;
        state.costCenters.forEach(cc => {
          if (cc.parentId === parentId) {
            idsToDelete.add(cc.id);
            currentIdsToCheck.push(cc.id);
          }
        });
      }
      return {
        ...state,
        costCenters: state.costCenters.filter(cc => !idsToDelete.has(cc.id)),
      };
    }
    default:
      return state;
  }
};

const DataContext = createContext<{ 
    state: AppState; 
    dispatch: React.Dispatch<Action>;
    generateId: (type: 'expense' | 'revenue' | 'settlement' | 'project' | 'supplier' | 'customer' | 'cashAccount' | 'costCenter' | 'revenueCategory' | 'lineItem') => string;
    getCostCenterTree: () => CostCenter[];
} | undefined>(undefined);

export const DataProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState, (init) => {
    const storedData = localStorage.getItem('apusAppData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
         // Helper to extract numeric part of ID
        const getMaxIdNum = (items: {id: string}[], prefixToRemove: string | RegExp = /[^0-9]/g) => {
          if (!items || items.length === 0) return 0;
          return Math.max(...items.map(item => parseInt(String(item.id).replace(prefixToRemove, '')) || 0), 0);
        };

        return {
          ...initialState, 
          ...parsed,        
          nextExpenseId: parsed.expenseEntries?.length ? getMaxIdNum(parsed.expenseEntries, /EXP-\d{4}-/g) + 1 : init.nextExpenseId,
          nextRevenueId: parsed.revenueEntries?.length ? getMaxIdNum(parsed.revenueEntries, /REV-\d{4}-/g) + 1 : init.nextRevenueId,
          nextSettlementId: parsed.settlements?.length ? getMaxIdNum(parsed.settlements, /SET-(P|R)-\d{4}-/g) + 1 : init.nextSettlementId,
          nextCostCenterId: parsed.costCenters?.length ? getMaxIdNum(parsed.costCenters, /cc-(user-)?/g) + 1 : init.nextCostCenterId,
        };
      } catch (error) {
        console.error("Failed to parse stored data:", error);
        localStorage.removeItem('apusAppData'); 
        return init;
      }
    }
    return init;
  });

  useEffect(() => {
    localStorage.setItem('apusAppData', JSON.stringify(state));
  }, [state]);

  const generateId = (type: 'expense' | 'revenue' | 'settlement' | 'project' | 'supplier' | 'customer' | 'cashAccount' | 'costCenter' | 'revenueCategory' | 'lineItem'): string => {
    const year = new Date().getFullYear();
    switch (type) {
      case 'expense': return `EXP-${year}-${String(state.nextExpenseId).padStart(5, '0')}`;
      case 'revenue': return `REV-${year}-${String(state.nextRevenueId).padStart(5, '0')}`;
      case 'settlement': {
        // This needs a bit more info to determine P or R, or a more generic SET id
        // For now, defaulting, but this might need adjustment based on where it's called
        const settlementPrefix = state.nextSettlementId % 2 === 0 ? 'P' : 'R'; // Placeholder logic
        return `SET-${settlementPrefix}-${year}-${String(state.nextSettlementId).padStart(5, '0')}`;
      }
      case 'costCenter': return `cc-user-${String(state.nextCostCenterId).padStart(3, '0')}`;
      case 'lineItem': return `li-${Date.now()}-${String(state.nextGenericItemId).padStart(3,'0')}`;
      // Add other cases
      default: return `generic-${Date.now()}`;
    }
  };

  const getCostCenterTree = (): CostCenter[] => {
    const costCenters = state.costCenters;
    const map = new Map<CostCenterId, CostCenter & { children: CostCenter[] }>(); // Ensure children is not optional here for map value
    const roots: (CostCenter & { children: CostCenter[] })[] = [];

    costCenters.forEach(cc => {
      map.set(cc.id, { ...cc, children: [] });
    });

    costCenters.forEach(cc => {
      const node = map.get(cc.id)!;
      if (cc.parentId && map.has(cc.parentId)) {
        const parentNode = map.get(cc.parentId)!;
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  };


  return (
    <DataContext.Provider value={{ state, dispatch, generateId, getCostCenterTree }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
