import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string;
  height?: string;
  className?: string;
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) {
  // Base styles for all variants
  const baseStyles = 'bg-gray-200 shimmer';
  
  // Variant-specific border radius
  const variantStyles = {
    text: 'rounded',        // 4px
    rectangular: 'rounded-lg', // 8px
    circular: 'rounded-full',  // 9999px
  };
  
  // Inline styles for custom dimensions
  const inlineStyles: React.CSSProperties = {};
  if (width) inlineStyles.width = width;
  if (height) inlineStyles.height = height;
  
  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={inlineStyles}
      aria-hidden="true"
    />
  );
}
