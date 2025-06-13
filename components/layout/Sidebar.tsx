import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiBarChart2, FiDollarSign, FiFileText, FiGrid, FiHome, FiTrendingDown, FiTrendingUp, FiChevronDown, FiChevronUp, FiArchive, FiList, FiBriefcase, FiCreditCard, FiUsers, FiUserCheck, FiTag } from 'react-icons/fi'; 
import type { IconBaseProps } from 'react-icons';

interface NavItemProps {
  to: string;
  icon: React.ReactElement<IconBaseProps>;
  label: string;
  hasSubmenu?: boolean;
  isOpen?: boolean;
  onClick?: () => void;
  isSubItem?: boolean;
}

const NavItem: React.FC<NavItemProps & { children?: React.ReactNode }> = ({ to, icon, label, hasSubmenu, isOpen, onClick, children, isSubItem }) => {
  const baseClasses = `flex items-center space-x-3 p-3 rounded-md hover:bg-orange-600 hover:text-white transition-colors duration-150 ${isSubItem ? 'pl-4 text-sm' : ''}`;
  const activeClasses = "bg-accent text-white"; 
  
  if (hasSubmenu) {
    return (
      <div>
        <button onClick={onClick} className={`${baseClasses} w-full text-left`}>
          {React.cloneElement(icon, { size: isSubItem ? 18 : 20})}
          <span className="flex-1">{label}</span>
          {hasSubmenu && (isOpen ? <FiChevronUp /> : <FiChevronDown />)}
        </button>
        {isOpen && <div className={`mt-1 space-y-1 ${isSubItem ? 'pl-4' : 'pl-2'}`}>{children}</div>}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : (isSubItem ? 'text-gray-300 hover:text-white' : 'text-neutral-light')}`}
    >
      {React.cloneElement(icon, { size: isSubItem ? 18 : 20})}
      <span>{label}</span>
    </NavLink>
  );
};


const Sidebar: React.FC = () => {
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-72 bg-primary text-neutral-light flex flex-col min-h-screen shadow-lg">
      <div className="p-4 border-b border-gray-700 h-[84px] flex items-center justify-center">
         <span className="text-2xl font-semibold text-white">APUS Gestão</span> 
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavItem to="/dashboard" icon={<FiHome />} label="Dashboard" />

        <NavItem icon={<FiTrendingDown />} label="Despesas" hasSubmenu isOpen={openSubmenus['despesas']} onClick={() => toggleSubmenu('despesas')} to="#">
            <NavItem to="/despesas" icon={<FiFileText />} label="Listar Despesas" isSubItem />
            <NavItem to="/despesas/nova" icon={<FiDollarSign />} label="Nova Despesa" isSubItem />
            <NavItem to="/despesas/historico-pagamentos" icon={<FiArchive />} label="Histórico de Pagamentos" isSubItem />
        </NavItem>
        
        <NavItem icon={<FiTrendingUp />} label="Receitas" hasSubmenu isOpen={openSubmenus['receitas']} onClick={() => toggleSubmenu('receitas')} to="#">
            <NavItem to="/receitas" icon={<FiFileText />} label="Listar Receitas" isSubItem />
            <NavItem to="/receitas/nova" icon={<FiDollarSign />} label="Nova Receita" isSubItem />
            <NavItem to="/receitas/historico-recebimentos" icon={<FiArchive />} label="Histórico de Recebimentos" isSubItem />
        </NavItem>
        
        <NavItem icon={<FiList />} label="Cadastros" hasSubmenu isOpen={openSubmenus['cadastros']} onClick={() => toggleSubmenu('cadastros')} to="#">
            <NavItem to="/cadastros/centros-custo" icon={<FiGrid />} label="Centros de Custo" isSubItem />
            <NavItem to="/cadastros/projetos" icon={<FiBriefcase />} label="Projetos (Obras)" isSubItem />
            <NavItem to="/cadastros/contas-caixa" icon={<FiCreditCard />} label="Contas Caixa" isSubItem />
            <NavItem to="/cadastros/fornecedores" icon={<FiUserCheck />} label="Fornecedores" isSubItem />
            <NavItem to="/cadastros/clientes" icon={<FiUsers />} label="Clientes" isSubItem />
            <NavItem to="/cadastros/categorias-receita" icon={<FiTag />} label="Categorias de Receita" isSubItem />
        </NavItem>

        <NavItem icon={<FiBarChart2 />} label="Relatórios" hasSubmenu isOpen={openSubmenus['relatorios']} onClick={() => toggleSubmenu('relatorios')} to="#">
            <NavItem to="/relatorios/orcamento-projeto" icon={<FiFileText />} label="Orçamento por Projeto" isSubItem />
            <NavItem to="/relatorios/fluxo-caixa" icon={<FiDollarSign />} label="Fluxo de Caixa" isSubItem />
        </NavItem>

        {/* Link direto para Centros de Custo - pode ser removido se for apenas via Cadastros */}
        <NavItem to="/centros-custo" icon={<FiGrid />} label="Centros de Custo (Direto)" />


      </nav>
      <div className="p-4 mt-auto border-t border-gray-700 text-center text-xs">
        <p>&copy; {new Date().getFullYear()} APUS Construtora</p>
        <p>Todos os direitos reservados.</p>
      </div>
    </div>
  );
};

export default Sidebar;
