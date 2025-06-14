import React, { useState, ReactNode } from 'react';
import { useData } from '../../contexts/DataContext';
import { Product } from '../../types';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import InputField from '../../components/ui/InputField';
import Table from '../../components/ui/Table';
import { ICONS } from '../../constants';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
  headerClassName?: string;
}

const ProductsPage: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const openModalForNew = () => {
    setCurrentProduct({ name: '', unit: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openModalForEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentProduct) {
      setCurrentProduct({ ...currentProduct, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentProduct && currentProduct.name && currentProduct.unit) {
      if (isEditing && currentProduct.id) {
        updateProduct(currentProduct as Product);
      } else {
        addProduct(currentProduct as Omit<Product, 'id'>);
      }
      closeModal();
    } else {
      alert("Por favor, preencha o nome e a unidade do produto.");
    }
  };

  const handleDelete = (id: string) => {
    // TODO: Add check if product is used in any expense entries before deleting
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProduct(id);
    }
  };

  const columns: Column<Product>[] = [
    { header: 'Nome do Produto', accessor: 'name' },
    { header: 'Unidade', accessor: 'unit', className: 'w-32' },
    {
      header: 'Ações',
      accessor: (item: Product) => (
        <div className="space-x-2">
          <Button variant="ghost" size="sm" onClick={() => openModalForEdit(item)} leftIcon={ICONS.EDIT}>Editar</Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)} leftIcon={ICONS.DELETE}>Excluir</Button>
        </div>
      ),
      className: 'w-48'
    },
  ];

  return (
    <div className="p-6 bg-neutral-bg min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-primary-dark">Gerenciar Produtos</h1>
        <Button onClick={openModalForNew} variant="primary" leftIcon={ICONS.ADD}>
          Adicionar Produto
        </Button>
      </div>

      <Table<Product> columns={columns} data={products} emptyStateMessage="Nenhum produto encontrado."/>

      {isModalOpen && currentProduct && (
        <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? 'Editar Produto' : 'Adicionar Novo Produto'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Nome do Produto"
              name="name"
              value={currentProduct.name || ''}
              onChange={handleChange}
              placeholder="Ex: Cimento CPII (saco 50kg)"
              required
            />
            <InputField
              label="Unidade de Medida"
              name="unit"
              value={currentProduct.unit || ''}
              onChange={handleChange}
              placeholder="Ex: sc, m³, kg, un, pç"
              required
            />
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
              <Button type="submit" variant="accent">{isEditing ? 'Salvar Alterações' : 'Adicionar Produto'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ProductsPage;
