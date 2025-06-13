
import React from 'react';
import RevenueForm from '../../components/revenues/RevenueForm';

const NewRevenuePage: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-primary mb-6">Novo Lançamento de Receita</h2>
      <RevenueForm />
    </div>
  );
};

export default NewRevenuePage;
    