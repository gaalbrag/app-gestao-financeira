import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { ExpenseEntry, LineItem, EntryType, TransactionType, EntryStatus, UnitOfMeasure, CostCenterId, ProjectId, SupplierId, CashAccountId, ExpenseId } from '../../types';
import { UNITS_OF_MEASURE, getFlatCostCenters } from '../../constants';
import Input, { TextArea } from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Table from '../ui/Table';
import { FiPlus, FiTrash2, FiSave, FiXCircle } from 'react-icons/fi';

interface ExpenseFormProps {
  initialExpense?: ExpenseEntry; 
}

interface ExpenseFormStateData {
  entryType: EntryType;
  invoiceNumber?: string;
  projectId: ProjectId | '';
  supplierId: SupplierId | '';
  disbursementDate: string;
  issueDate: string;
  transactionType: TransactionType;
  description?: string;
  cashAccountId: CashAccountId | '';
  costCenterId: CostCenterId | '';
  lineItems: LineItem[];
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ initialExpense }) => {
  const { state, dispatch, generateId } = useData();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ExpenseFormStateData>({
    entryType: initialExpense?.entryType || EntryType.FINANCIAL,
    invoiceNumber: initialExpense?.invoiceNumber || '',
    projectId: initialExpense?.projectId || '',
    supplierId: initialExpense?.supplierId || '',
    disbursementDate: initialExpense?.disbursementDate || new Date().toISOString().split('T')[0],
    issueDate: initialExpense?.issueDate || new Date().toISOString().split('T')[0],
    transactionType: initialExpense?.transactionType || TransactionType.PRODUCT,
    description: initialExpense?.description || '',
    cashAccountId: initialExpense?.cashAccountId || '',
    costCenterId: initialExpense?.costCenterId || '', 
    lineItems: initialExpense?.lineItems || [],
  });

  const [lineItemModalOpen, setLineItemModalOpen] = useState(false);
  const [currentLineItem, setCurrentLineItem] = useState<Partial<LineItem>>({
    itemName: '', quantity: 1, unitOfMeasure: UnitOfMeasure.UNIT, unitPrice: 0
  });

  const flatProductCostCenters = useMemo(() => {
    return getFlatCostCenters(state.costCenters, state.costCenters).filter(cc => cc.isProductLevel);
  }, [state.costCenters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLineItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numValue = (name === 'quantity' || name === 'unitPrice') ? parseFloat(value) : value;
    setCurrentLineItem(prev => ({ ...prev, [name]: numValue }));
  };

  const addOrUpdateLineItem = () => {
    if (!currentLineItem.itemName || !currentLineItem.quantity || !currentLineItem.unitPrice || !currentLineItem.unitOfMeasure) {
      alert("Por favor, preencha todos os campos do item."); 
      return;
    }
    const totalValue = (currentLineItem.quantity || 0) * (currentLineItem.unitPrice || 0);
    const newLineItem: LineItem = {
      id: currentLineItem.id || generateId('lineItem'),
      itemName: currentLineItem.itemName,
      quantity: currentLineItem.quantity,
      unitOfMeasure: currentLineItem.unitOfMeasure,
      unitPrice: currentLineItem.unitPrice,
      totalValue: totalValue,
    };

    setFormData(prev => ({
      ...prev,
      lineItems: currentLineItem.id 
        ? prev.lineItems.map(li => li.id === currentLineItem.id ? newLineItem : li)
        : [...prev.lineItems, newLineItem]
    }));
    setLineItemModalOpen(false);
    setCurrentLineItem({ itemName: '', quantity: 1, unitOfMeasure: UnitOfMeasure.UNIT, unitPrice: 0 });
  };
  
  const removeLineItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(li => li.id !== id)
    }));
  };

  const openLineItemModal = (item?: LineItem) => {
    setCurrentLineItem(item || { itemName: '', quantity: 1, unitOfMeasure: UnitOfMeasure.UNIT, unitPrice: 0 });
    setLineItemModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.supplierId || !formData.cashAccountId || !formData.costCenterId || formData.lineItems.length === 0) {
        alert("Por favor, preencha todos os campos obrigatórios (Projeto, Fornecedor, Conta Caixa, Centro de Custo) e adicione pelo menos um item."); 
        return;
    }

    const totalAmount = formData.lineItems.reduce((sum, item) => sum + item.totalValue, 0);
    
    const newExpense: ExpenseEntry = {
      ...formData,
      id: generateId('expense') as ExpenseId,
      projectId: formData.projectId as ProjectId, // Cast after validation
      supplierId: formData.supplierId as SupplierId, // Cast after validation
      cashAccountId: formData.cashAccountId as CashAccountId, // Cast after validation
      costCenterId: formData.costCenterId as CostCenterId, // Cast after validation
      totalAmount,
      amountPaid: 0,
      status: EntryStatus.PENDING,
    };
    dispatch({ type: 'ADD_EXPENSE_ENTRY', payload: newExpense });
    navigate('/despesas');
  };
  
  const lineItemTableColumns: typeof Table<LineItem>['arguments']['columns'] = [
      { Header: 'Item', accessor: 'itemName' },
      { Header: 'Qtd.', accessor: 'quantity', cellClassName: 'text-right' },
      { Header: 'Un.', accessor: 'unitOfMeasure' },
      { Header: 'Preço Unit.', accessor: row => `R$ ${row.unitPrice.toFixed(2)}`, cellClassName: 'text-right' },
      { Header: 'Total', accessor: row => `R$ ${row.totalValue.toFixed(2)}`, cellClassName: 'text-right font-semibold' },
      { Header: 'Ações', accessor: (row: LineItem) => (
          <div className="flex space-x-2">
            {/* <Button size="sm" variant="ghost" onClick={() => openLineItemModal(row)} leftIcon={<FiEdit2 />}>Editar</Button> */}
            <Button size="sm" variant="danger" onClick={() => removeLineItem(row.id)} leftIcon={<FiTrash2 />}>Remover</Button>
          </div>
        )
      },
  ];


  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Select label="Tipo de Lançamento" name="entryType" value={formData.entryType} onChange={handleInputChange} required>
          {Object.values(EntryType).map(type => <option key={type} value={type}>{type}</option>)}
        </Select>
        <Input label="Nº da Nota Fiscal" name="invoiceNumber" value={formData.invoiceNumber || ''} onChange={handleInputChange} />
        <Select label="Projeto" name="projectId" value={formData.projectId} onChange={handleInputChange} required>
          <option value="">Selecione um Projeto</option>
          {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select label="Fornecedor" name="supplierId" value={formData.supplierId} onChange={handleInputChange} required>
          <option value="">Selecione um Fornecedor</option>
          {state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Input label="Data de Vencimento" type="date" name="disbursementDate" value={formData.disbursementDate} onChange={handleInputChange} required />
        <Input label="Data de Emissão da NF" type="date" name="issueDate" value={formData.issueDate} onChange={handleInputChange} required />
        <Select label="Tipo de Transação" name="transactionType" value={formData.transactionType} onChange={handleInputChange}>
          {Object.values(TransactionType).map(type => <option key={type} value={type}>{type}</option>)}
        </Select>
        <Select label="Conta Caixa (Origem Pagto)" name="cashAccountId" value={formData.cashAccountId} onChange={handleInputChange} required>
          <option value="">Selecione uma Conta Caixa</option>
          {state.cashAccounts.map(ca => <option key={ca.id} value={ca.id}>{ca.name}</option>)}
        </Select>
        <Select 
            label="Centro de Custo (Produto/Serviço)" 
            name="costCenterId" 
            value={formData.costCenterId} 
            onChange={handleInputChange} 
            required
        >
            <option value="">Selecione um Centro de Custo</option>
            {flatProductCostCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.path}</option>)}
        </Select>
      </div>
      <TextArea label="Descrição Geral" name="description" value={formData.description || ''} onChange={handleInputChange} />

      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-primary">Itens da Despesa</h3>
            <Button type="button" variant="secondary" onClick={() => openLineItemModal()} leftIcon={<FiPlus/>}>Adicionar Item</Button>
        </div>
        <Table columns={lineItemTableColumns} data={formData.lineItems} emptyMessage="Nenhum item adicionado." />
        {formData.lineItems.length > 0 && (
            <div className="text-right mt-4 text-xl font-semibold text-primary">
                Total Geral: R$ {formData.lineItems.reduce((sum, item) => sum + item.totalValue, 0).toFixed(2)}
            </div>
        )}
      </div>

      <Modal isOpen={lineItemModalOpen} onClose={() => setLineItemModalOpen(false)} title={currentLineItem.id ? "Editar Item" : "Adicionar Novo Item"}>
        <div className="space-y-4">
            <Input label="Nome do Item/Serviço" name="itemName" value={currentLineItem.itemName || ''} onChange={handleLineItemChange} required />
            <div className="grid grid-cols-3 gap-4">
                <Input label="Quantidade" type="number" name="quantity" value={currentLineItem.quantity || ''} onChange={handleLineItemChange} min="0.01" step="0.01" required />
                <Select label="Un. Medida" name="unitOfMeasure" value={currentLineItem.unitOfMeasure || ''} onChange={handleLineItemChange} required>
                    {UNITS_OF_MEASURE.map(uom => <option key={uom.id} value={uom.id}>{uom.name}</option>)}
                </Select>
                <Input label="Preço Unitário (R$)" type="number" name="unitPrice" value={currentLineItem.unitPrice || ''} onChange={handleLineItemChange} min="0.01" step="0.01" required />
            </div>
            <p className="font-semibold">Valor Total do Item: R$ {((currentLineItem.quantity || 0) * (currentLineItem.unitPrice || 0)).toFixed(2)}</p>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setLineItemModalOpen(false)} leftIcon={<FiXCircle/>}>Cancelar</Button>
              <Button type="button" onClick={addOrUpdateLineItem} leftIcon={<FiSave/>}>{currentLineItem.id ? "Salvar Alterações" : "Adicionar Item"}</Button>
            </div>
        </div>
      </Modal>

      <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
        <Button type="button" variant="ghost" onClick={() => navigate('/despesas')} leftIcon={<FiXCircle/>}>Cancelar</Button>
        <Button type="submit" leftIcon={<FiSave/>}>Salvar Lançamento de Despesa</Button>
      </div>
    </form>
  );
};

export default ExpenseForm;
