
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import ExpenseListPage from './pages/expenses/ExpenseListPage';
import NewExpensePage from './pages/expenses/NewExpensePage';
import RevenueListPage from './pages/revenues/RevenueListPage';
import NewRevenuePage from './pages/revenues/NewRevenuePage';
import CostCenterAdminPage from './pages/costcenters/CostCenterAdminPage';
import ProjectBudgetReportPage from './pages/reports/ProjectBudgetReportPage';
import CashFlowReportPage from './pages/reports/CashFlowReportPage';
import PaymentHistoryPage from './pages/expenses/PaymentHistoryPage';
import ReceiptHistoryPage from './pages/revenues/ReceiptHistoryPage';

// Placeholder Admin Pages
import ProjectsAdminPage from './pages/admin/ProjectsAdminPage';
import CashAccountsAdminPage from './pages/admin/CashAccountsAdminPage';
import SuppliersAdminPage from './pages/admin/SuppliersAdminPage';
import CustomersAdminPage from './pages/admin/CustomersAdminPage';
import RevenueCategoriesAdminPage from './pages/admin/RevenueCategoriesAdminPage';


const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          
          <Route path="/despesas" element={<ExpenseListPage />} />
          <Route path="/despesas/nova" element={<NewExpensePage />} />
          <Route path="/despesas/historico-pagamentos" element={<PaymentHistoryPage />} />
          
          <Route path="/receitas" element={<RevenueListPage />} />
          <Route path="/receitas/nova" element={<NewRevenuePage />} />
          <Route path="/receitas/historico-recebimentos" element={<ReceiptHistoryPage />} />

          {/* Route for Cost Centers remains, but it's also part of new Admin section */}
          <Route path="/centros-custo" element={<CostCenterAdminPage />} /> 
          
          <Route path="/relatorios/orcamento-projeto" element={<ProjectBudgetReportPage />} />
          <Route path="/relatorios/fluxo-caixa" element={<CashFlowReportPage />} />

          {/* New Admin Section Routes */}
          <Route path="/cadastros/centros-custo" element={<CostCenterAdminPage />} />
          <Route path="/cadastros/projetos" element={<ProjectsAdminPage />} />
          <Route path="/cadastros/contas-caixa" element={<CashAccountsAdminPage />} />
          <Route path="/cadastros/fornecedores" element={<SuppliersAdminPage />} />
          <Route path="/cadastros/clientes" element={<CustomersAdminPage />} />
          <Route path="/cadastros/categorias-receita" element={<RevenueCategoriesAdminPage />} />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} /> {/* Fallback route */}
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
