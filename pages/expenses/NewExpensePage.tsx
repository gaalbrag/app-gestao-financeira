
import React from 'react';
import ExpenseForm from '../../components/expenses/ExpenseForm';

const NewExpensePage: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-primary mb-6">Novo Lançamento de Despesa</h2>
      <ExpenseForm />
    </div>
  );
};

export default NewExpensePage;
    