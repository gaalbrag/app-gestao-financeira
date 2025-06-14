import React from 'react';
import { useData } from '../../contexts/DataContext';
import CostCenterNodeDisplay from '../../components/ui/CostCenterNodeDisplay';
import Button from '../../components/ui/Button';
import { ICONS } from '../../constants';
import { CostCenterNode } from '../../types';

const CostCentersPage: React.FC = () => {
  const { costCenters, addCostCenterNode, updateCostCenterNode, deleteCostCenterNode } = useData();

  const handleAddRootNode = () => {
    const name = prompt("Digite o nome para o novo centro de custo raiz:");
    if (name) {
      addCostCenterNode(name, null);
    }
  };

  const handleAddChild = (parentId: string, name: string) => {
    addCostCenterNode(name, parentId);
  };

  const handleEditNode = (nodeId: string, newName: string, isLaunchable: boolean) => {
    updateCostCenterNode(nodeId, newName, isLaunchable);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este centro de custo e todos os seus filhos? Esta ação não pode ser desfeita.")) {
      const nodeToDelete = findNodeRecursive(costCenters, nodeId);
      if (nodeToDelete && nodeToDelete.children.length > 0) {
        if (!window.confirm("Este centro de custo possui sub-categorias. Excluí-lo também excluirá todas as sub-categorias. Continuar?")) {
          return;
        }
      }
      deleteCostCenterNode(nodeId);
    }
  };
  
  const findNodeRecursive = (nodes: CostCenterNode[], id: string): CostCenterNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeRecursive(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };


  return (
    <div className="p-6 bg-neutral-bg min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-primary-dark">Gerenciar Centros de Custo</h1>
        <Button onClick={handleAddRootNode} variant="primary" leftIcon={ICONS.ADD}>
          Adicionar Categoria Raiz
        </Button>
      </div>

      <div className="bg-neutral-card p-4 rounded-lg shadow">
        {costCenters.length === 0 ? (
          <p className="text-text-muted">Nenhum centro de custo definido. Clique em "Adicionar Categoria Raiz" para começar.</p>
        ) : (
          costCenters.map((rootNode) => (
            <CostCenterNodeDisplay
              key={rootNode.id}
              node={rootNode}
              level={0}
              onAddChild={handleAddChild}
              onEditNode={handleEditNode}
              onDeleteNode={handleDeleteNode}
              isRoot={true} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CostCentersPage;