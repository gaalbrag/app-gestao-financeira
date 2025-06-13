import React, { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactElement<React.SVGAttributes<SVGElement>>;
  rightIcon?: React.ReactElement<React.SVGAttributes<SVGElement>>;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyles = "font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: 'bg-accent text-white hover:bg-orange-700 focus:ring-orange-500',
    secondary: 'bg-primary text-white hover:bg-blue-900 focus:ring-blue-700',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-primary hover:bg-gray-200 focus:ring-gray-400 border border-primary'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {leftIcon && React.cloneElement(leftIcon, { className: 'w-5 h-5' })}
      <span>{children}</span>
      {rightIcon && React.cloneElement(rightIcon, { className: 'w-5 h-5' })}
    </button>
  );
};

export default Button;