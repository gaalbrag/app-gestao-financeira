
import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Settlement } from '../../types';
import Table from '../../components/ui/Table';

const PaymentHistoryPage: React.FC = () => {
  const { state } = useData();

  const paymentSettlements = state.settlements
    .filter(s => s.type === 'payment')
    .sort((a,b) => new Date(b.settlementDate).getTime() - new Date(a.settlementDate).getTime());

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

  const columns: typeof Table<Settlement>['arguments']['columns'] = [
    { Header: 'ID da Liquidação', accessor: 'id' },
    { Header: 'ID da Despesa', accessor: 'entryId' },
    { 
      Header: 'Fornecedor', 
      accessor: (row) => {
        const expense = state.expenseEntries.find(e => e.id === row.entryId);
        return expense ? state.suppliers.find(s => s.id === expense.supplierId)?.name : 'N/A';
      } 
    },
    { Header: 'Data da Liquidação', accessor: 'settlementDate' },
    { Header: 'Valor Liquidado', accessor: (row) => formatCurrency(row.amountSettled), cellClassName: 'text-right font-semibold' },
    { Header: 'Conta Caixa', accessor: (row) => state.cashAccounts.find(ca => ca.id === row.cashAccountId)?.name || 'N/A' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-primary">Histórico de Pagamentos Efetuados</h2>
      <Table columns={columns} data={paymentSettlements} emptyMessage="Nenhum pagamento efetuado ainda." />
    </div>
  );
};

export default PaymentHistoryPage;
    