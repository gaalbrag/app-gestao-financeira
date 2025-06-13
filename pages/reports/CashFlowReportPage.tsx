
import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Settlement, FilterState } from '../../types';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import { FiFilter } from 'react-icons/fi';


const CashFlowReportPage: React.FC = () => {
  const { state } = useData();
  const [filters, setFilters] = useState<FilterState>({
    cashAccountId: '', // All accounts by default
    startDate: '',
    endDate: '',
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

  const filteredSettlements = useMemo(() => {
    return state.settlements.filter(s => {
      const accountMatch = filters.cashAccountId ? s.cashAccountId === filters.cashAccountId : true;
      let dateMatch = true;
      if (filters.startDate && filters.endDate) {
        dateMatch = s.settlementDate >= filters.startDate && s.settlementDate <= filters.endDate;
      } else if (filters.startDate) {
        dateMatch = s.settlementDate >= filters.startDate;
      } else if (filters.endDate) {
        dateMatch = s.settlementDate <= filters.endDate;
      }
      return accountMatch && dateMatch;
    }).sort((a,b) => new Date(a.settlementDate).getTime() - new Date(b.settlementDate).getTime()); // Sort chronologically
  }, [filters, state.settlements]);

  const summary = useMemo(() => {
    const totalInflows = filteredSettlements
      .filter(s => s.type === 'receipt')
      .reduce((sum, s) => sum + s.amountSettled, 0);
    const totalOutflows = filteredSettlements
      .filter(s => s.type === 'payment')
      .reduce((sum, s) => sum + s.amountSettled, 0);
    return { totalInflows, totalOutflows, netCashFlow: totalInflows - totalOutflows };
  }, [filteredSettlements]);

  const tableColumns: typeof Table<Settlement>['arguments']['columns'] = [
    { Header: 'Data', accessor: 'settlementDate' },
    { 
      Header: 'Descrição', 
      accessor: (row) => {
        const entry = row.type === 'payment' 
            ? state.expenseEntries.find(e => e.id === row.entryId)
            : state.revenueEntries.find(r => r.id === row.entryId);
        
        let partyName = 'N/A';
        if (entry) {
            if ('supplierId' in entry) { // ExpenseEntry
                partyName = state.suppliers.find(s => s.id === entry.supplierId)?.name || 'Fornecedor Desconhecido';
            } else if ('customerId' in entry) { // RevenueEntry
                partyName = state.customers.find(c => c.id === entry.customerId)?.name || 'Cliente Desconhecido';
            }
        }
        return `${row.type === 'payment' ? 'Pagamento para' : 'Recebimento de'} ${partyName} (Ref: ${row.entryId})`;
      } 
    },
    { 
      Header: 'Entrada (R$)', 
      accessor: row => row.type === 'receipt' ? formatCurrency(row.amountSettled) : '-',
      cellClassName: 'text-right text-green-600 font-semibold'
    },
    { 
      Header: 'Saída (R$)', 
      accessor: row => row.type === 'payment' ? formatCurrency(row.amountSettled) : '-',
      cellClassName: 'text-right text-red-600 font-semibold'
    },
    { Header: 'Conta Caixa', accessor: row => state.cashAccounts.find(ca => ca.id === row.cashAccountId)?.name || 'N/A' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-primary">Relatório de Fluxo de Caixa</h2>
      
      <div className="bg-white p-4 rounded-lg shadow-md space-y-4 md:flex md:space-x-4 items-end">
        <Select label="Selecionar Conta Caixa" name="cashAccountId" value={filters.cashAccountId || ''} onChange={handleFilterChange} containerClassName="flex-1">
          <option value="">Todas as Contas</option>
          {state.cashAccounts.map(ca => <option key={ca.id} value={ca.id}>{ca.name}</option>)}
        </Select>
        <Input label="Data Inicial" type="date" name="startDate" value={filters.startDate || ''} onChange={handleFilterChange} containerClassName="flex-1"/>
        <Input label="Data Final" type="date" name="endDate" value={filters.endDate || ''} onChange={handleFilterChange} containerClassName="flex-1"/>
         <Button variant="ghost" onClick={() => setFilters({ cashAccountId: '', startDate: '', endDate: ''})} leftIcon={<FiFilter />}>Limpar Filtros</Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-primary mb-4">Resumo do Período</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-100 p-4 rounded-md shadow">
                <p className="text-sm text-green-700">Total de Entradas</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(summary.totalInflows)}</p>
            </div>
            <div className="bg-red-100 p-4 rounded-md shadow">
                <p className="text-sm text-red-700">Total de Saídas</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(summary.totalOutflows)}</p>
            </div>
            <div className={`${summary.netCashFlow >=0 ? 'bg-blue-100' : 'bg-orange-100'} p-4 rounded-md shadow`}>
                <p className={`text-sm ${summary.netCashFlow >=0 ? 'text-blue-700' : 'text-orange-700'}`}>Fluxo de Caixa Líquido</p>
                <p className={`text-2xl font-bold ${summary.netCashFlow >=0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(summary.netCashFlow)}</p>
            </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
         <h3 className="text-xl font-semibold text-primary mb-4">Lista Detalhada de Transações Liquidadas</h3>
         <Table columns={tableColumns} data={filteredSettlements} emptyMessage="Nenhuma transação liquidada para os filtros selecionados."/>
      </div>

    </div>
  );
};

export default CashFlowReportPage;
    