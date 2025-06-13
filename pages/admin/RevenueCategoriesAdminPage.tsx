
import React from 'react';
// import { useData } from '../../contexts/DataContext';
// import { RevenueCategory } from '../../types';
// import Table from '../../components/ui/Table';
// import Button from '../../components/ui/Button';
// import Modal from '../../components/ui/Modal';
// import Input from '../../components/ui/Input';
// import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const RevenueCategoriesAdminPage: React.FC = () => {
  // const { state, dispatch } = useData();
  // TODO: Implement state for modal, current category, etc.
  // TODO: Implement handlers for add, edit, delete

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-primary">Gerenciar Categorias de Receita</h2>
        {/* <Button onClick={() => {}} leftIcon={<FiPlus />}>Nova Categoria</Button> */}
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600">Funcionalidade de gerenciamento de categorias de receita será implementada aqui.</p>
        {/* Placeholder for table and modal */}
      </div>
    </div>
  );
};

export default RevenueCategoriesAdminPage;
