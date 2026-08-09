import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-card border border-border rounded-xl p-4 transition-all duration-150 ${className}`}>
      {children}
    </div>
  );
}