
import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Settlement } from '../../types';
import Table from '../../components/ui/Table';

const ReceiptHistoryPage: React.FC = () => {
  const { state } = useData();

  const receiptSettlements = state.settlements
    .filter(s => s.type === 'receipt')
    .sort((a,b) => new Date(b.settlementDate).getTime() - new Date(a.settlementDate).getTime());

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

  const columns: typeof Table<Settlement>['arguments']['columns'] = [
    { Header: 'ID da Liquidação', accessor: 'id' },
    { Header: 'ID da Receita', accessor: 'entryId' },
    { 
      Header: 'Cliente', 
      accessor: (row) => {
        const revenue = state.revenueEntries.find(r => r.id === row.entryId);
        return revenue ? state.customers.find(c => c.id === revenue.customerId)?.name : 'N/A';
      } 
    },
    { Header: 'Data da Liquidação', accessor: 'settlementDate' },
    { Header: 'Valor Liquidado', accessor: (row) => formatCurrency(row.amountSettled), cellClassName: 'text-right font-semibold' },
    { Header: 'Conta Caixa', accessor: (row) => state.cashAccounts.find(ca => ca.id === row.cashAccountId)?.name || 'N/A' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-primary">Histórico de Recebimentos Efetuados</h2>
      <Table columns={columns} data={receiptSettlements} emptyMessage="Nenhum recebimento efetuado ainda." />
    </div>
  );
};

export default ReceiptHistoryPage;
    