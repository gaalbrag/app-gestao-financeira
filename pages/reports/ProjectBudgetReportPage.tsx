
import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../../contexts/DataContext';
import { Project, CostCenter, ExpenseEntry, FilterState, CostCenterId } from '../../types';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { FiChevronRight, FiChevronDown, FiFilter } from 'react-icons/fi';

interface ReportCostCenterNode extends CostCenter {
  totalExpenses: number;
  children: ReportCostCenterNode[]; // Always define children for report structure
}

const ProjectBudgetReportPage: React.FC = () => {
  const { state } = useData();
  const [filters, setFilters] = useState<FilterState>({
    projectId: state.projects[0]?.id || '',
    startDate: '',
    endDate: '',
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

  const reportData = useMemo(() => {
    if (!filters.projectId) return { reportTree: [], projectTotalExpenses: 0, projectTotalRevenue: 0 };

    const projectExpenses = state.expenseEntries.filter(exp => {
      let dateMatch = true;
      if (filters.startDate && filters.endDate) {
        dateMatch = exp.issueDate >= filters.startDate && exp.issueDate <= filters.endDate;
      } else if (filters.startDate) {
        dateMatch = exp.issueDate >= filters.startDate;
      } else if (filters.endDate) {
        dateMatch = exp.issueDate <= filters.endDate;
      }
      return exp.projectId === filters.projectId && dateMatch;
    });

    const projectRevenues = state.revenueEntries
      .filter(rev => {
        let dateMatch = true;
        if (filters.startDate && filters.endDate) {
          dateMatch = rev.issueDate >= filters.startDate && rev.issueDate <= filters.endDate;
        } else if (filters.startDate) {
          dateMatch = rev.issueDate >= filters.startDate;
        } else if (filters.endDate) {
          dateMatch = rev.issueDate <= filters.endDate;
        }
        return rev.projectId === filters.projectId && dateMatch;
      })
      .reduce((sum, rev) => sum + rev.totalAmount, 0);

    const projectTotalExpensesFromDirectEntries = projectExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
    
    const buildReportTreeRecursive = (parentId: CostCenterId | null, allCCs: CostCenter[]): ReportCostCenterNode[] => {
        return allCCs
            .filter(cc => cc.parentId === parentId)
            .map(cc => {
                const children = buildReportTreeRecursive(cc.id, allCCs);
                let nodeTotalExpenses = 0;

                // Sum expenses directly associated with this node (if it's a productLevel)
                if (cc.isProductLevel) {
                    nodeTotalExpenses += projectExpenses
                        .filter(exp => exp.costCenterId === cc.id)
                        .reduce((sum, exp) => sum + exp.totalAmount, 0);
                }
                
                // Sum expenses from children
                nodeTotalExpenses += children.reduce((sum, child) => sum + child.totalExpenses, 0);
                
                return {
                    ...cc,
                    totalExpenses: nodeTotalExpenses,
                    children: children,
                };
            });
    };
    
    const reportTree = buildReportTreeRecursive(null, state.costCenters);
    
    // The projectTotalExpenses should be the sum of expenses from root cost centers in the report tree
    const calculatedProjectTotalExpenses = reportTree.reduce((sum, rootNode) => sum + rootNode.totalExpenses, 0);

    return { reportTree, projectTotalExpenses: calculatedProjectTotalExpenses, projectTotalRevenue: projectRevenues };

  }, [filters, state.expenseEntries, state.revenueEntries, state.costCenters]);

  const CostCenterRow: React.FC<{ node: ReportCostCenterNode; level: number }> = ({ node, level }) => {
    const [isOpen, setIsOpen] = useState(level < 2); // Auto-open more levels for reports
    return (
      <>
        <tr className={`${level === 0 ? 'bg-gray-100 font-semibold' : ''} ${node.totalExpenses === 0 && level > 0 ? 'text-gray-400' : ''}`}>
          <td className="py-2 px-3 border-b" style={{ paddingLeft: `${10 + level * 20}px` }}>
            <div className="flex items-center">
              {node.children && node.children.length > 0 && (
                <button onClick={() => setIsOpen(!isOpen)} className="mr-2 text-primary hover:text-accent">
                  {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                </button>
              )}
              {(!node.children || node.children.length === 0) && <span className="w-6 mr-2"></span>}
              {node.name}
            </div>
          </td>
          <td className="py-2 px-3 border-b text-right">{formatCurrency(node.totalExpenses)}</td>
        </tr>
        {isOpen && node.children?.map(child => <CostCenterRow key={child.id} node={child} level={level + 1} />)}
      </>
    );
  };
  
  const selectedProjectName = state.projects.find(p => p.id === filters.projectId)?.name;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-primary">Relatório de Orçamento por Projeto</h2>
      
      <div className="bg-white p-4 rounded-lg shadow-md space-y-4 md:flex md:space-x-4 items-end">
        <Select label="Selecionar Projeto" name="projectId" value={filters.projectId || ''} onChange={handleFilterChange} containerClassName="flex-1">
          <option value="">Selecione um Projeto</option>
          {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Input label="Data Inicial (Lançamento)" type="date" name="startDate" value={filters.startDate || ''} onChange={handleFilterChange} containerClassName="flex-1"/>
        <Input label="Data Final (Lançamento)" type="date" name="endDate" value={filters.endDate || ''} onChange={handleFilterChange} containerClassName="flex-1"/>
        <Button variant="ghost" onClick={() => setFilters({ projectId: state.projects[0]?.id || '', startDate: '', endDate: ''})} leftIcon={<FiFilter />}>Limpar Filtros</Button>
      </div>

      {filters.projectId && selectedProjectName && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-primary mb-4">Análise do Projeto: {selectedProjectName}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-md shadow border-l-4 border-red-500">
                <p className="text-sm text-red-700">Total de Despesas (Projeto)</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(reportData.projectTotalExpenses)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-md shadow border-l-4 border-green-500">
                <p className="text-sm text-green-700">Total de Receitas (Projeto)</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(reportData.projectTotalRevenue)}</p>
            </div>
             <div className={`${reportData.projectTotalRevenue - reportData.projectTotalExpenses >= 0 ? 'bg-blue-50 border-blue-500' : 'bg-orange-50 border-orange-500'} p-4 rounded-md shadow border-l-4`}>
                <p className={`text-sm ${reportData.projectTotalRevenue - reportData.projectTotalExpenses >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Resultado (Receitas - Despesas)</p>
                <p className={`text-2xl font-bold ${reportData.projectTotalRevenue - reportData.projectTotalExpenses >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    {formatCurrency(reportData.projectTotalRevenue - reportData.projectTotalExpenses)}
                </p>
            </div>
          </div>

          <h4 className="text-lg font-semibold text-primary mb-2">Despesas por Centro de Custo:</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="py-2 px-3 text-left">Centro de Custo</th>
                  <th className="py-2 px-3 text-right">Total Despesas</th>
                </tr>
              </thead>
              <tbody>
                {reportData.reportTree.map(node => <CostCenterRow key={node.id} node={node} level={0} />)}
                 {reportData.reportTree.length === 0 && (
                    <tr><td colSpan={2} className="p-4 text-center text-gray-500">Nenhum dado de centro de custo para este projeto/filtro.</td></tr>
                 )}
              </tbody>
            </table>
          </div>
        </div>
      )}
       {(!filters.projectId || !selectedProjectName) && <p className="text-center text-gray-500 mt-6">Por favor, selecione um projeto para visualizar o relatório.</p>}
    </div>
  );
};

export default ProjectBudgetReportPage;
