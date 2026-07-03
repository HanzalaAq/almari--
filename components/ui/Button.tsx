import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'font-medium rounded-xl transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-[0.97] cursor-pointer';

  const variantStyles = {
    primary:
      'bg-brand text-white hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/20 focus:ring-brand',
    secondary:
      'bg-gray-100 text-foreground hover:bg-gray-200 focus:ring-gray-300',
    outline:
      'border-2 border-brand text-brand hover:bg-brand hover:text-white focus:ring-brand hover:shadow-lg hover:shadow-brand/20',
  };

  const sizeStyles = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
