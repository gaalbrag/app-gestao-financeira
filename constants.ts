
import { Project, Supplier, Customer, CashAccount, CostCenter, RevenueCategory, UnitOfMeasure, ProjectId, SupplierId, CustomerId, CashAccountId, CostCenterId, RevenueCategoryId } from './types';

export const APP_NAME = "APUS Construtora - Gestão Financeira";

export const INITIAL_PROJECTS: Project[] = [
  { id: 'proj-001', name: 'Residencial Alegria', description: 'Construção de edifício residencial de 10 andares.' },
  { id: 'proj-002', name: 'Comercial Vision', description: 'Edifício comercial com foco em escritórios modernos.' },
  { id: 'proj-003', name: 'Infraestrutura Urbana Leste', description: 'Obras de pavimentação e saneamento.' },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup-001', name: 'Material Forte Ltda.', contact: 'João Silva - (11) 98765-4321' },
  { id: 'sup-002', name: 'Serviços Precisão ME', contact: 'Maria Oliveira - (21) 91234-5678' },
  { id: 'sup-003', name: 'Cimento Real S.A.', contact: 'Carlos Pereira - (31) 99999-8888' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust-001', name: 'Invest Imóveis Ltda.', contact: 'Ana Costa - (41) 98888-7777' },
  { id: 'cust-002', name: 'Família Souza', contact: 'Pedro Souza - (51) 97777-6666' },
];

export const INITIAL_CASH_ACCOUNTS: CashAccount[] = [
  { id: 'ca-001', name: 'Banco Alfa - C/C 010203-4' },
  { id: 'ca-002', name: 'Banco Beta - C/C 98765-0' },
  { id: 'ca-003', name: 'Caixa Interno da Obra Alfa' },
];

export const INITIAL_REVENUE_CATEGORIES: RevenueCategory[] = [
  { id: 'revcat-001', name: 'Venda de Unidade Imobiliária' },
  { id: 'revcat-002', name: 'Taxa de Serviço de Construção' },
  { id: 'revcat-003', name: 'Aluguel de Equipamento' },
];

export const UNITS_OF_MEASURE: { id: UnitOfMeasure; name: string }[] = [
  { id: UnitOfMeasure.SQM, name: 'm²' },
  { id: UnitOfMeasure.KG, name: 'kg' },
  { id: UnitOfMeasure.UNIT, name: 'un' },
  { id: UnitOfMeasure.HOUR, name: 'hr' },
  { id: UnitOfMeasure.VB, name: 'vb' },
  { id: UnitOfMeasure.M3, name: 'm³' },
];

export const INITIAL_COST_CENTERS: CostCenter[] = [
  { id: 'cc-proj', name: 'Custos do Projeto', parentId: null, children: [
    { id: 'cc-prelim', name: 'Serviços Preliminares', parentId: 'cc-proj', children: [
      { id: 'cc-prelim-marcacao', name: 'Marcação do Local', parentId: 'cc-prelim', isProductLevel: true }
    ]},
    { id: 'cc-estrutura', name: 'Estrutura', parentId: 'cc-proj', children: [
      { id: 'cc-estrutura-fund', name: 'Fundações', parentId: 'cc-estrutura', isProductLevel: true },
      { id: 'cc-estrutura-concreto', name: 'Concreto Armado', parentId: 'cc-estrutura', isProductLevel: true }
    ]},
    { id: 'cc-vedacoes', name: 'Vedações e Fechamentos', parentId: 'cc-proj', children: [
      { id: 'cc-vedacoes-alvenaria', name: 'Alvenaria', parentId: 'cc-vedacoes', children: [
        { id: 'cc-prod-cimento', name: 'Cimento CPII', parentId: 'cc-vedacoes-alvenaria', isProductLevel: true },
        { id: 'cc-prod-aco', name: 'Aço CA50', parentId: 'cc-vedacoes-alvenaria', isProductLevel: true }
      ]},
      { id: 'cc-vedacoes-esquadrias', name: 'Esquadrias', parentId: 'cc-vedacoes', isProductLevel: true },
      { id: 'cc-vedacoes-vidros', name: 'Vidros', parentId: 'cc-vedacoes', isProductLevel: true }
    ]}
  ]},
  { id: 'cc-admin', name: 'Administrativo', parentId: null, children: [
    { id: 'cc-admin-mo', name: 'Mão de Obra', parentId: 'cc-admin', isProductLevel: true },
    { id: 'cc-admin-seg', name: 'Segurança do Trabalho', parentId: 'cc-admin', isProductLevel: true },
    { id: 'cc-admin-equip', name: 'Aluguel de Equipamentos', parentId: 'cc-admin', isProductLevel: true }
  ]},
  { id: 'cc-marketing', name: 'Marketing', parentId: null, isProductLevel: true },
  { id: 'cc-corretagem', name: 'Taxas de Corretagem', parentId: null, isProductLevel: true },
  { id: 'cc-impostos', name: 'Impostos', parentId: null, isProductLevel: true },
  { id: 'cc-posobra', name: 'Pós-Construção', parentId: null, isProductLevel: true },
  { id: 'cc-desenv', name: 'Desenvolvimento Imobiliário', parentId: null, children: [
    { id: 'cc-desenv-arq', name: 'Projeto Arquitetônico', parentId: 'cc-desenv', isProductLevel: true }
  ]},
  { id: 'cc-terreno', name: 'Aquisição de Terreno', parentId: null, isProductLevel: true },
];

// Helper to flatten cost centers for dropdowns, including path
export const getFlatCostCenters = (
  nodes: CostCenter[],
  allNodes: CostCenter[], // Pass all nodes to find parents for path reconstruction
  parentPath = ''
): { id: CostCenterId; name: string; isProductLevel?: boolean; path: string }[] => {
  let flatList: { id: CostCenterId; name: string; isProductLevel?: boolean; path: string }[] = [];

  const buildPath = (nodeId: CostCenterId | null, currentAllNodes: CostCenter[]): string => {
    if (!nodeId) return '';
    const node = currentAllNodes.find(n => n.id === nodeId);
    if (!node) return '';
    const parentName = buildPath(node.parentId, currentAllNodes);
    return parentName ? `${parentName} > ${node.name}` : node.name;
  };

  for (const node of nodes) {
    const currentPath = buildPath(node.id, allNodes);
    flatList.push({ id: node.id, name: node.name, isProductLevel: node.isProductLevel, path: currentPath });
    // If it has children (explicitly or implicitly by parentId linkage), recurse
    const children = allNodes.filter(n => n.parentId === node.id);
    if (children.length > 0) {
      // Note: The recursive call here might lead to deeper paths than intended if not careful.
      // The path generation should ideally happen once per node.
      // The current approach builds the full path for each node when it's added.
    }
  }
  // To ensure correct paths, it might be better to build paths iteratively or store them on nodes.
  // For now, this version of getFlatCostCenters returns each node with its full path.
  // The 'parentPath' argument is somewhat misleading in this revised version.

  // Let's refine path generation:
  // Create a map for quick parent lookup if not already structured with children property
  const nodeMap = new Map(allNodes.map(n => [n.id, n]));

  const getPathForNode = (nodeId: CostCenterId): string => {
    const parts: string[] = [];
    let current: CostCenter | undefined = nodeMap.get(nodeId);
    while(current) {
      parts.unshift(current.name);
      current = current.parentId ? nodeMap.get(current.parentId) : undefined;
    }
    return parts.join(' > ');
  }
  
  // Re-iterate to build list with correct full paths
  flatList = [];
  for (const node of nodes) { // nodes here should be ALL cost centers
     flatList.push({
        id: node.id,
        name: node.name, // The simple name
        isProductLevel: node.isProductLevel,
        path: getPathForNode(node.id) // The full hierarchical name
     });
  }
  return flatList.sort((a,b) => a.path.localeCompare(b.path)); // Sort by path for consistent dropdown order
};
