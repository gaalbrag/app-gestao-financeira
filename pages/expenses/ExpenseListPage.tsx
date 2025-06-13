import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { ExpenseEntry, EntryStatus, Settlement, CashAccountId, SettlementId } from '../../types';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { FiDollarSign, FiPlus, FiFilter, FiCheckCircle } from 'react-icons/fi';

const ExpenseListPage: React.FC = () => {
  const { state, dispatch, generateId } = useData();
  const navigate = useNavigate();

  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseEntry | null>(null);
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [settlementDate, setSettlementDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [settlementCashAccountId, setSettlementCashAccountId] = useState<CashAccountId | ''>('');
  
  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [filterSupplierId, setFilterSupplierId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');


  const openSettlementModal = (expense: ExpenseEntry) => {
    setSelectedExpense(expense);
    const balanceDue = expense.totalAmount - expense.amountPaid;
    setSettlementAmount(balanceDue > 0 ? balanceDue : 0); // Default to balance due
    setSettlementDate(new Date().toISOString().split('T')[0]);
    setSettlementCashAccountId(expense.cashAccountId || ''); // Default to original cash account
    setSettlementModalOpen(true);
  };

  const handleConfirmSettlement = () => {
    if (!selectedExpense || settlementAmount <= 0 || !settlementCashAccountId) {
      alert("Valor inválido ou conta caixa não selecionada."); 
      return;
    }
    const balanceDue = selectedExpense.totalAmount - selectedExpense.amountPaid;
    if (settlementAmount > balanceDue) {
      alert("Valor a liquidar não pode ser maior que o saldo devedor.");
      return;
    }

    const newSettlement: Settlement = {
      id: generateId('settlement') as SettlementId, // Use generateId
      entryId: selectedExpense.id,
      settlementDate,
      amountSettled: settlementAmount,
      cashAccountId: settlementCashAccountId as CashAccountId, // Cast after validation
      type: 'payment',
    };

    // Note: The reducer for ADD_SETTLEMENT already updates the expense entry's amountPaid and status.
    // So, dispatching UPDATE_EXPENSE_ENTRY here might be redundant if ADD_SETTLEMENT handles it.
    // For now, assuming ADD_SETTLEMENT is the source of truth for updating related entries.
    dispatch({ type: 'ADD_SETTLEMENT', payload: newSettlement });
    // If ADD_SETTLEMENT doesn't update the original expense, this would be needed:
    // dispatch({ type: 'UPDATE_EXPENSE_ENTRY', payload: updatedExpense }); 

    setSettlementModalOpen(false);
    setSelectedExpense(null);
  };
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

  const getStatusBadge = (status: EntryStatus) => {
    switch (status) {
      case EntryStatus.PENDING: return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">{status}</span>;
      case EntryStatus.PARTIALLY_PAID: return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-200 rounded-full">{status}</span>;
      case EntryStatus.PAID: return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">{status}</span>;
      default: return status;
    }
  };
  
  const filteredExpenses = useMemo(() => {
    return state.expenseEntries.filter(exp => {
        const projectMatch = filterProjectId ? exp.projectId === filterProjectId : true;
        const supplierMatch = filterSupplierId ? exp.supplierId === filterSupplierId : true;
        const statusMatch = filterStatus ? exp.status === filterStatus : true;
        return projectMatch && supplierMatch && statusMatch;
    }).sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()); // Sort by most recent
  }, [state.expenseEntries, filterProjectId, filterSupplierId, filterStatus]);


  const columns: typeof Table<ExpenseEntry>['arguments']['columns'] = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Fornecedor', accessor: row => state.suppliers.find(s => s.id === row.supplierId)?.name || 'N/A' },
    { Header: 'Projeto', accessor: row => state.projects.find(p => p.id === row.projectId)?.name || 'N/A' },
    { Header: 'NF', accessor: 'invoiceNumber' },
    { Header: 'Valor Total', accessor: row => formatCurrency(row.totalAmount), cellClassName: 'text-right' },
    { Header: 'Valor Pago', accessor: row => formatCurrency(row.amountPaid), cellClassName: 'text-right' },
    { Header: 'Saldo Devedor', accessor: row => formatCurrency(row.totalAmount - row.amountPaid), cellClassName: 'text-right font-semibold' },
    { Header: 'Vencimento', accessor: 'disbursementDate' },
    { Header: 'Status', accessor: row => getStatusBadge(row.status) },
    { Header: 'Ações', accessor: (row: ExpenseEntry) => (
        row.status !== EntryStatus.PAID ? (
          <Button size="sm" onClick={() => openSettlementModal(row)} leftIcon={<FiCheckCircle />}>Liquidar</Button>
        ) : <span className="text-green-600 font-semibold">Liquidado</span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-primary">Contas a Pagar</h2>
        <Button onClick={() => navigate('/despesas/nova')} leftIcon={<FiPlus />}>Novo Lançamento</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md space-y-4 md:space-y-0 md:flex md:space-x-4 items-end">
        <Select label="Filtrar por Projeto" value={filterProjectId} onChange={e => setFilterProjectId(e.target.value)} containerClassName="flex-1">
            <option value="">Todos os Projetos</option>
            {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select label="Filtrar por Fornecedor" value={filterSupplierId} onChange={e => setFilterSupplierId(e.target.value)} containerClassName="flex-1">
            <option value="">Todos os Fornecedores</option>
            {state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select label="Filtrar por Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} containerClassName="flex-1">
            <option value="">Todos os Status</option>
            {Object.values(EntryStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Button variant="ghost" onClick={() => { setFilterProjectId(''); setFilterSupplierId(''); setFilterStatus('');}} leftIcon={<FiFilter />}>Limpar Filtros</Button>
      </div>

      <Table columns={columns} data={filteredExpenses} />

      {selectedExpense && (
        <Modal isOpen={settlementModalOpen} onClose={() => setSettlementModalOpen(false)} title={`Liquidar Pagamento: ${selectedExpense.id}`}>
          <div className="space-y-4">
            <p><strong>Fornecedor:</strong> {state.suppliers.find(s => s.id === selectedExpense.supplierId)?.name}</p>
            <p><strong>Valor Total:</strong> {formatCurrency(selectedExpense.totalAmount)}</p>
            <p><strong>Valor Já Pago:</strong> {formatCurrency(selectedExpense.amountPaid)}</p>
            <p className="font-semibold text-accent"><strong>Saldo Devedor:</strong> {formatCurrency(selectedExpense.totalAmount - selectedExpense.amountPaid)}</p>
            
            <Input 
              label="Valor a Liquidar Agora (R$)" 
              type="number" 
              value={settlementAmount} 
              onChange={e => setSettlementAmount(parseFloat(e.target.value))}
              min="0.01"
              max={selectedExpense.totalAmount - selectedExpense.amountPaid}
              step="0.01"
              required 
            />
            <Input 
              label="Data da Liquidação" 
              type="date" 
              value={settlementDate} 
              onChange={e => setSettlementDate(e.target.value)} 
              required 
            />
            <Select 
              label="Conta Caixa (Origem do Pagamento)" 
              value={settlementCashAccountId} 
              onChange={e => setSettlementCashAccountId(e.target.value as CashAccountId | '')} 
              required
            >
              <option value="">Selecione uma Conta Caixa</option>
              {state.cashAccounts.map(ca => <option key={ca.id} value={ca.id}>{ca.name}</option>)}
            </Select>
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="ghost" onClick={() => setSettlementModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleConfirmSettlement} leftIcon={<FiDollarSign />}>Confirmar Pagamento</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExpenseListPage;
