
import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { CostCenter, CostCenterId } from '../../types';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select'; // Needed for parent selection
import { FiChevronRight, FiChevronDown, FiPlus, FiEdit2, FiTrash2, FiSave, FiXCircle } from 'react-icons/fi';
import { getFlatCostCenters } from '../../constants';


interface CostCenterFormData {
  id?: CostCenterId;
  name: string;
  parentId: CostCenterId | null | ''; // Allow '' for dropdown placeholder
  isProductLevel: boolean;
}

interface CostCenterNodeProps {
  node: CostCenter & { children?: CostCenter[] }; // Expect node with children pre-populated
  level: number;
  onAddChild: (parentId: CostCenterId) => void;
  onEdit: (costCenter: CostCenter) => void;
  onDelete: (costCenterId: CostCenterId) => void;
}

const CostCenterNodeDisplay: React.FC<CostCenterNodeProps> = ({ node, level, onAddChild, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = React.useState(level < 1); // Auto-open first level

  return (
    <div style={{ marginLeft: `${level * 10}px` }} className="py-1 my-1 border-l-2 border-gray-200 pl-2">
      <div 
        className="flex items-center justify-between group p-2 rounded hover:bg-gray-100"
      >
        <div className="flex items-center flex-grow" onClick={() => node.children && node.children.length > 0 && setIsOpen(!isOpen)}>
            {node.children && node.children.length > 0 && (
            isOpen ? <FiChevronDown size={16} className="mr-2 text-primary cursor-pointer" /> : <FiChevronRight size={16} className="mr-2 text-primary cursor-pointer" />
            )}
            {!node.children || node.children.length === 0 && <span className="w-[16px] mr-2"></span>} {/* Placeholder for alignment */}
            <span className={`font-medium ${node.isProductLevel ? 'text-accent' : 'text-primary'}`}>
            {node.name} {node.isProductLevel && <span className="text-xs text-gray-500">(Item de Custo)</span>}
            </span>
        </div>
        <div className="space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" onClick={() => onAddChild(node.id)} title="Adicionar Filho"><FiPlus size={14}/></Button>
            <Button size="sm" variant="ghost" onClick={() => onEdit(node)} title="Editar"><FiEdit2 size={14}/></Button>
            <Button size="sm" variant="danger" onClick={() => onDelete(node.id)} title="Excluir"><FiTrash2 size={14}/></Button>
        </div>
      </div>
      {isOpen && node.children && node.children.length > 0 && (
        <div className="mt-1">
          {node.children.map(child => (
            <CostCenterNodeDisplay key={child.id} node={child} level={level + 1} onAddChild={onAddChild} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
};


const CostCenterAdminPage: React.FC = () => {
  const { state, dispatch, generateId, getCostCenterTree } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentFormData, setCurrentFormData] = useState<CostCenterFormData>({
    name: '',
    parentId: null,
    isProductLevel: false,
  });

  const costCenterTree = useMemo(() => getCostCenterTree(), [state.costCenters, getCostCenterTree]);
  
  // For parent selection dropdown
  const flatCostCentersForSelect = useMemo(() => {
    return getFlatCostCenters(state.costCenters, state.costCenters)
           .map(cc => ({ id: cc.id, name: cc.path }));
  }, [state.costCenters]);


  const handleOpenModal = (mode: 'add' | 'edit', costCenter?: CostCenter, parentIdForNewChild: CostCenterId | null = null) => {
    setModalMode(mode);
    if (mode === 'edit' && costCenter) {
      setCurrentFormData({
        id: costCenter.id,
        name: costCenter.name,
        parentId: costCenter.parentId,
        isProductLevel: !!costCenter.isProductLevel,
      });
    } else { // 'add' mode
      setCurrentFormData({
        name: '',
        parentId: parentIdForNewChild, // Pre-fill parent if adding a child
        isProductLevel: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Reset form
     setCurrentFormData({ name: '', parentId: null, isProductLevel: false });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setCurrentFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setCurrentFormData(prev => ({ ...prev, [name]: value === "NULL_PARENT" ? null : value }));
    }
  };

  const handleSubmit = () => {
    if (!currentFormData.name.trim()) {
      alert("O nome do Centro de Custo é obrigatório.");
      return;
    }

    const costCenterData: Omit<CostCenter, 'children' | 'path'> = {
      id: currentFormData.id || generateId('costCenter') as CostCenterId,
      name: currentFormData.name.trim(),
      parentId: currentFormData.parentId === '' ? null : currentFormData.parentId as CostCenterId | null,
      isProductLevel: currentFormData.isProductLevel,
      isUserManaged: true,
    };

    if (modalMode === 'add') {
      dispatch({ type: 'ADD_COST_CENTER', payload: costCenterData });
    } else { // 'edit'
      dispatch({ type: 'UPDATE_COST_CENTER', payload: costCenterData });
    }
    handleCloseModal();
  };

  const handleDelete = (costCenterId: CostCenterId) => {
    if (window.confirm("Tem certeza que deseja excluir este centro de custo e todos os seus filhos? Esta ação não pode ser desfeita.")) {
      dispatch({ type: 'DELETE_COST_CENTER', payload: costCenterId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-primary">Gerenciar Centros de Custo</h2>
        <Button onClick={() => handleOpenModal('add', undefined, null)} leftIcon={<FiPlus />}>
          Adicionar Centro de Custo Raiz
        </Button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {costCenterTree.length === 0 && <p className="text-gray-500">Nenhum centro de custo cadastrado.</p>}
        {costCenterTree.map(rootNode => (
             <CostCenterNodeDisplay 
                key={rootNode.id} 
                node={rootNode} 
                level={0} 
                onAddChild={(parentId) => handleOpenModal('add', undefined, parentId)}
                onEdit={(cc) => handleOpenModal('edit', cc)}
                onDelete={handleDelete}
            />
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'add' ? "Adicionar Centro de Custo" : "Editar Centro de Custo"}>
        <div className="space-y-4">
          <Input 
            label="Nome do Centro de Custo" 
            name="name" 
            value={currentFormData.name} 
            onChange={handleInputChange} 
            required 
          />
          <Select
            label="Centro de Custo Pai"
            name="parentId"
            value={currentFormData.parentId === null ? "NULL_PARENT" : currentFormData.parentId || ""}
            onChange={handleInputChange}
            // Disable if editing a root node and trying to set its own parent, or if adding a child (parentId is fixed)
            // For simplicity, always allow changing parent for now, except for root's own parent.
            disabled={modalMode === 'add' && currentFormData.parentId !== null && currentFormData.id !== undefined && currentFormData.id === currentFormData.parentId}
          >
            <option value="NULL_PARENT">Nenhum (Raiz)</option>
            {flatCostCentersForSelect
              .filter(cc => cc.id !== currentFormData.id) // Cannot be its own parent
              .map(cc => (
              <option key={cc.id} value={cc.id}>{cc.name}</option>
            ))}
          </Select>
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="isProductLevel" 
              name="isProductLevel" 
              checked={currentFormData.isProductLevel} 
              onChange={handleInputChange} 
              className="h-4 w-4 text-accent border-gray-300 rounded focus:ring-accent mr-2"
            />
            <label htmlFor="isProductLevel" className="text-sm text-gray-700">É um item de custo final (para lançamento de despesas)?</label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={handleCloseModal} leftIcon={<FiXCircle />}>Cancelar</Button>
            <Button onClick={handleSubmit} leftIcon={<FiSave />}>{modalMode === 'add' ? 'Adicionar' : 'Salvar Alterações'}</Button>
          </div>
        </div>
      </Modal>

      <div className="bg-white p-6 rounded-lg shadow-md mt-8">
        <h3 className="text-xl font-semibold text-primary mb-4">Categorias de Receita</h3>
         <ul className="list-disc pl-5 space-y-1">
            {state.revenueCategories.map(rc => (
                <li key={rc.id} className="text-gray-700">{rc.name}</li>
            ))}
        </ul>
         <p className="text-sm text-gray-600 mt-4">
          A gestão de Categorias de Receita será implementada na seção "Cadastros".
        </p>
      </div>
    </div>
  );
};

export default CostCenterAdminPage;
