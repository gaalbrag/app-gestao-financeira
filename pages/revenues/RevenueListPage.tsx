import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { RevenueEntry, EntryStatus, Settlement, CashAccountId, SettlementId } from '../../types';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { FiDollarSign, FiPlus, FiFilter, FiCheckCircle } from 'react-icons/fi';

const RevenueListPage: React.FC = () => {
  const { state, dispatch, generateId } = useData();
  const navigate = useNavigate();

  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<RevenueEntry | null>(null);
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [settlementDate, setSettlementDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [settlementCashAccountId, setSettlementCashAccountId] = useState<CashAccountId | ''>('');

  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [filterCustomerId, setFilterCustomerId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');


  const openSettlementModal = (revenue: RevenueEntry) => {
    setSelectedRevenue(revenue);
    const balanceDue = revenue.totalAmount - revenue.amountPaid;
    setSettlementAmount(balanceDue > 0 ? balanceDue : 0);
    setSettlementDate(new Date().toISOString().split('T')[0]);
    setSettlementCashAccountId(revenue.cashAccountId || '');
    setSettlementModalOpen(true);
  };

  const handleConfirmSettlement = () => {
    if (!selectedRevenue || settlementAmount <= 0 || !settlementCashAccountId) {
      alert("Valor inválido ou conta caixa não selecionada.");
      return;
    }
    const balanceDue = selectedRevenue.totalAmount - selectedRevenue.amountPaid;
    if (settlementAmount > balanceDue) {
      alert("Valor a liquidar não pode ser maior que o saldo a receber.");
      return;
    }

    const newSettlement: Settlement = {
      id: generateId('settlement') as SettlementId, // Use generateId
      entryId: selectedRevenue.id,
      settlementDate,
      amountSettled: settlementAmount,
      cashAccountId: settlementCashAccountId as CashAccountId, // Cast after validation
      type: 'receipt',
    };
    
    // Assuming ADD_SETTLEMENT in the reducer handles updating the revenue entry's status and amountPaid
    dispatch({ type: 'ADD_SETTLEMENT', payload: newSettlement });
    // If not, explicit update would be needed:
    // dispatch({ type: 'UPDATE_REVENUE_ENTRY', payload: updatedRevenue });

    setSettlementModalOpen(false);
    setSelectedRevenue(null);
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

  const filteredRevenues = useMemo(() => {
    return state.revenueEntries.filter(rev => {
        const projectMatch = filterProjectId ? rev.projectId === filterProjectId : true;
        const customerMatch = filterCustomerId ? rev.customerId === filterCustomerId : true;
        const statusMatch = filterStatus ? rev.status === filterStatus : true;
        return projectMatch && customerMatch && statusMatch;
    }).sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [state.revenueEntries, filterProjectId, filterCustomerId, filterStatus]);


  const columns: typeof Table<RevenueEntry>['arguments']['columns'] = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Cliente', accessor: row => state.customers.find(c => c.id === row.customerId)?.name || 'N/A' },
    { Header: 'Projeto', accessor: row => state.projects.find(p => p.id === row.projectId)?.name || 'N/A' },
    { Header: 'NF', accessor: 'invoiceNumber' },
    { Header: 'Valor Total', accessor: row => formatCurrency(row.totalAmount), cellClassName: 'text-right' },
    { Header: 'Valor Recebido', accessor: row => formatCurrency(row.amountPaid), cellClassName: 'text-right' },
    { Header: 'Saldo a Receber', accessor: row => formatCurrency(row.totalAmount - row.amountPaid), cellClassName: 'text-right font-semibold' },
    { Header: 'Prev. Recebimento', accessor: 'expectedReceiptDate' },
    { Header: 'Status', accessor: row => getStatusBadge(row.status) },
    { Header: 'Ações', accessor: (row: RevenueEntry) => (
        row.status !== EntryStatus.PAID ? (
          <Button size="sm" onClick={() => openSettlementModal(row)} leftIcon={<FiCheckCircle />}>Liquidar</Button>
        ) : <span className="text-green-600 font-semibold">Liquidado</span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-primary">Contas a Receber</h2>
        <Button onClick={() => navigate('/receitas/nova')} leftIcon={<FiPlus />}>Novo Lançamento</Button>
      </div>

       <div className="bg-white p-4 rounded-lg shadow-md space-y-4 md:space-y-0 md:flex md:space-x-4 items-end">
        <Select label="Filtrar por Projeto" value={filterProjectId} onChange={e => setFilterProjectId(e.target.value)} containerClassName="flex-1">
            <option value="">Todos os Projetos</option>
            {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select label="Filtrar por Cliente" value={filterCustomerId} onChange={e => setFilterCustomerId(e.target.value)} containerClassName="flex-1">
            <option value="">Todos os Clientes</option>
            {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select label="Filtrar por Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} containerClassName="flex-1">
            <option value="">Todos os Status</option>
            {Object.values(EntryStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Button variant="ghost" onClick={() => { setFilterProjectId(''); setFilterCustomerId(''); setFilterStatus('');}} leftIcon={<FiFilter />}>Limpar Filtros</Button>
      </div>

      <Table columns={columns} data={filteredRevenues} />

      {selectedRevenue && (
        <Modal isOpen={settlementModalOpen} onClose={() => setSettlementModalOpen(false)} title={`Liquidar Recebimento: ${selectedRevenue.id}`}>
          <div className="space-y-4">
            <p><strong>Cliente:</strong> {state.customers.find(c => c.id === selectedRevenue.customerId)?.name}</p>
            <p><strong>Valor Total:</strong> {formatCurrency(selectedRevenue.totalAmount)}</p>
            <p><strong>Valor Já Recebido:</strong> {formatCurrency(selectedRevenue.amountPaid)}</p>
            <p className="font-semibold text-accent"><strong>Saldo a Receber:</strong> {formatCurrency(selectedRevenue.totalAmount - selectedRevenue.amountPaid)}</p>
            
            <Input 
              label="Valor a Liquidar Agora (R$)" 
              type="number" 
              value={settlementAmount} 
              onChange={e => setSettlementAmount(parseFloat(e.target.value))}
              min="0.01"
              max={selectedRevenue.totalAmount - selectedRevenue.amountPaid}
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
              label="Conta Caixa (Destino do Recebimento)" 
              value={settlementCashAccountId} 
              onChange={e => setSettlementCashAccountId(e.target.value as CashAccountId | '')} 
              required
            >
              <option value="">Selecione uma Conta Caixa</option>
              {state.cashAccounts.map(ca => <option key={ca.id} value={ca.id}>{ca.name}</option>)}
            </Select>
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="ghost" onClick={() => setSettlementModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleConfirmSettlement} leftIcon={<FiDollarSign />}>Confirmar Recebimento</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RevenueListPage;
