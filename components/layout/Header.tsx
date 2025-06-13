
import React from 'react';
import { FiUser, FiBell, FiSettings } from 'react-icons/fi'; // Using react-icons

const Header: React.FC = () => {
  return (
    <header className="bg-primary text-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">APUS Construtora - Gestão</h1>
      <div className="flex items-center space-x-4">
        <button className="hover:text-accent focus:outline-none">
          <FiBell size={20} />
        </button>
        <button className="hover:text-accent focus:outline-none">
          <FiSettings size={20} />
        </button>
        <button className="hover:text-accent focus:outline-none">
          <FiUser size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
    