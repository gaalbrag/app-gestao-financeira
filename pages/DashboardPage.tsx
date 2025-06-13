import React from 'react';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiArchive } from 'react-icons/fi';
import { useData } from '../contexts/DataContext';
import { EntryStatus } from '../types';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactElement<{ size?: number | string; className?: string } & React.SVGAttributes<SVGElement>>; color: string }> = ({ title, value, icon, color }) => (
  <div className={`bg-white p-6 rounded-lg shadow-lg flex items-center space-x-4 border-l-4 ${color}`}>
    <div className="p-3 bg-gray-100 rounded-full">
      {React.cloneElement(icon, { size: 24, className: 'text-primary' })}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-primary">{value}</p>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { state } = useData();

  const totalRevenue = state.revenueEntries.reduce((sum, entry) => sum + entry.totalAmount, 0);
  const totalExpenses = state.expenseEntries.reduce((sum, entry) => sum + entry.totalAmount, 0);
  const pendingExpenses = state.expenseEntries.filter(e => e.status === EntryStatus.PENDING).length;
  const pendingRevenues = state.revenueEntries.filter(r => r.status === EntryStatus.PENDING).length;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-primary">Dashboard Visão Geral</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Receita Total Prevista" value={formatCurrency(totalRevenue)} icon={<FiTrendingUp />} color="border-green-500" />
        <StatCard title="Despesa Total Prevista" value={formatCurrency(totalExpenses)} icon={<FiTrendingDown />} color="border-red-500" />
        <StatCard title="Despesas Pendentes" value={pendingExpenses} icon={<FiArchive />} color="border-yellow-500" />
        <StatCard title="Receitas Pendentes" value={pendingRevenues} icon={<FiDollarSign />} color="border-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-primary mb-4">Despesas Recentes</h3>
          {state.expenseEntries.slice(0, 5).map(exp => (
            <div key={exp.id} className="py-2 border-b last:border-b-0">
              <p className="text-sm font-medium">{state.suppliers.find(s => s.id === exp.supplierId)?.name || 'Fornecedor Desconhecido'}</p>
              <p className="text-xs text-gray-500">{exp.description || 'Sem descrição'} - {formatCurrency(exp.totalAmount)}</p>
            </div>
          ))}
          {state.expenseEntries.length === 0 && <p className="text-sm text-gray-500">Nenhuma despesa registrada.</p>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-primary mb-4">Receitas Recentes</h3>
           {state.revenueEntries.slice(0, 5).map(rev => (
            <div key={rev.id} className="py-2 border-b last:border-b-0">
              <p className="text-sm font-medium">{state.customers.find(c => c.id === rev.customerId)?.name || 'Cliente Desconhecido'}</p>
              <p className="text-xs text-gray-500">{rev.description || 'Sem descrição'} - {formatCurrency(rev.totalAmount)}</p>
            </div>
          ))}
          {state.revenueEntries.length === 0 && <p className="text-sm text-gray-500">Nenhuma receita registrada.</p>}
        </div>
      </div>
      
    </div>
  );
};

export default DashboardPage;