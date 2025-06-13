import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { RevenueEntry, LineItem, EntryType, EntryStatus, UnitOfMeasure, ProjectId, CustomerId, CashAccountId, RevenueCategoryId, RevenueId } from '../../types';
import { UNITS_OF_MEASURE } from '../../constants';
import Input, { TextArea } from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Table from '../ui/Table';
import { FiPlus, FiTrash2, FiSave, FiXCircle } from 'react-icons/fi';

interface RevenueFormStateData {
  entryType: EntryType;
  invoiceNumber?: string;
  projectId: ProjectId | '';
  customerId: CustomerId | '';
  expectedReceiptDate: string;
  issueDate: string;
  description?: string;
  cashAccountId: CashAccountId | '';
  costCenterId: RevenueCategoryId | ''; // In RevenueEntry, costCenterId is RevenueCategoryId
  relatedProductId?: string;
  lineItems: LineItem[];
}

const RevenueForm: React.FC = () => {
  const { state, dispatch, generateId } = useData();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RevenueFormStateData>({
    entryType: EntryType.FINANCIAL,
    invoiceNumber: '',
    projectId: '',
    customerId: '',
    expectedReceiptDate: new Date().toISOString().split('T')[0],
    issueDate: new Date().toISOString().split('T')[0],
    description: '',
    cashAccountId: '', 
    costCenterId: '', 
    relatedProductId: '',
    lineItems: [],
  });

  const [lineItemModalOpen, setLineItemModalOpen] = useState(false);
  const [currentLineItem, setCurrentLineItem] = useState<Partial<LineItem>>({
    itemName: '', quantity: 1, unitOfMeasure: UnitOfMeasure.UNIT, unitPrice: 0
  });

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
     if (!formData.projectId || !formData.customerId || !formData.cashAccountId || !formData.costCenterId || formData.lineItems.length === 0) {
        alert("Por favor, preencha todos os campos obrigatórios e adicione pelo menos um item de receita.");
        return;
    }
    const totalAmount = formData.lineItems.reduce((sum, item) => sum + item.totalValue, 0);
    
    const newRevenue: RevenueEntry = {
      ...formData,
      id: generateId('revenue') as RevenueId, // Cast generated ID
      projectId: formData.projectId as ProjectId, // Cast after validation
      customerId: formData.customerId as CustomerId, // Cast after validation
      cashAccountId: formData.cashAccountId as CashAccountId, // Cast after validation
      costCenterId: formData.costCenterId as RevenueCategoryId, // Cast after validation
      totalAmount,
      amountPaid: 0,
      status: EntryStatus.PENDING,
    };
    dispatch({ type: 'ADD_REVENUE_ENTRY', payload: newRevenue });
    navigate('/receitas');
  };
  
  const lineItemTableColumns: typeof Table<LineItem>['arguments']['columns'] = [
      { Header: 'Item/Serviço', accessor: 'itemName' },
      { Header: 'Qtd.', accessor: 'quantity', cellClassName: 'text-right' },
      { Header: 'Un.', accessor: 'unitOfMeasure' },
      { Header: 'Preço Unit.', accessor: row => `R$ ${row.unitPrice.toFixed(2)}`, cellClassName: 'text-right' },
      { Header: 'Total', accessor: row => `R$ ${row.totalValue.toFixed(2)}`, cellClassName: 'text-right font-semibold' },
      { Header: 'Ações', accessor: (row: LineItem) => (
          <div className="flex space-x-2">
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
        <Select label="Cliente" name="customerId" value={formData.customerId} onChange={handleInputChange} required>
          <option value="">Selecione um Cliente</option>
          {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Input label="Data Prev. Recebimento" type="date" name="expectedReceiptDate" value={formData.expectedReceiptDate} onChange={handleInputChange} required />
        <Input label="Data de Emissão da NF" type="date" name="issueDate" value={formData.issueDate} onChange={handleInputChange} required />
         <Select label="Conta Caixa (Destino Receb.)" name="cashAccountId" value={formData.cashAccountId} onChange={handleInputChange} required>
          <option value="">Selecione uma Conta Caixa</option>
          {state.cashAccounts.map(ca => <option key={ca.id} value={ca.id}>{ca.name}</option>)}
        </Select>
        <Select label="Categoria da Receita" name="costCenterId" value={formData.costCenterId} onChange={handleInputChange} required>
            <option value="">Selecione uma Categoria</option>
            {state.revenueCategories.map(rc => <option key={rc.id} value={rc.id}>{rc.name}</option>)}
        </Select>
        <Input label="Produto Relacionado (Ex: Apto 101)" name="relatedProductId" value={formData.relatedProductId || ''} onChange={handleInputChange} />
      </div>
      <TextArea label="Descrição Geral" name="description" value={formData.description || ''} onChange={handleInputChange} />

      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-primary">Itens da Receita</h3>
            <Button type="button" variant="secondary" onClick={() => openLineItemModal()} leftIcon={<FiPlus/>}>Adicionar Item</Button>
        </div>
        <Table columns={lineItemTableColumns} data={formData.lineItems} emptyMessage="Nenhum item adicionado." />
         {formData.lineItems.length > 0 && (
            <div className="text-right mt-4 text-xl font-semibold text-primary">
                Total Geral: R$ {formData.lineItems.reduce((sum, item) => sum + item.totalValue, 0).toFixed(2)}
            </div>
        )}
      </div>

      <Modal isOpen={lineItemModalOpen} onClose={() => setLineItemModalOpen(false)} title={currentLineItem.id ? "Editar Item" : "Adicionar Novo Item de Receita"}>
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
        <Button type="button" variant="ghost" onClick={() => navigate('/receitas')} leftIcon={<FiXCircle/>}>Cancelar</Button>
        <Button type="submit" leftIcon={<FiSave/>}>Salvar Lançamento de Receita</Button>
      </div>
    </form>
  );
};

export default RevenueForm;
