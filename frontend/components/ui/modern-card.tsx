import React from 'react';
import { cn } from '@/lib/utils';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'layered' | 'highlighted' | 'document';
  onClick?: () => void;
}

export function ModernCard({ 
  children, 
  className, 
  variant = 'default',
  onClick 
}: ModernCardProps) {
  const baseClasses = "rounded-xl transition-all duration-200 cursor-pointer";
  
  const variantClasses = {
    default: "bg-white border border-gray-200 shadow-sm hover:shadow-md",
    layered: "bg-white border border-gray-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1",
    highlighted: "bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 shadow-md hover:shadow-lg",
    document: "bg-white border border-gray-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 relative overflow-hidden"
  };

  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant],
        onClick && "hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface DocumentCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  className?: string;
  onClick?: () => void;
}

export function DocumentCard({ 
  title, 
  subtitle, 
  icon, 
  highlight = false,
  className,
  onClick 
}: DocumentCardProps) {
  return (
    <ModernCard 
      variant="document" 
      className={cn("p-6", className)}
      onClick={onClick}
    >
      {/* Highlight bar */}
      {highlight && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500" />
      )}
      
      {/* Header with icon */}
      <div className="flex items-start space-x-3 mb-4">
        {icon && (
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      
      {/* Content area with lines */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
      
      {/* Bottom section with values */}
      <div className="mt-4 flex items-center justify-end space-x-2">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">€</div>
          <div className="text-xs text-gray-500">Value</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">€</div>
          <div className="text-xs text-gray-500">Amount</div>
        </div>
      </div>
    </ModernCard>
  );
}

interface LayeredCardStackProps {
  cards: Array<{
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    highlight?: boolean;
  }>;
  className?: string;
}

export function LayeredCardStack({ cards, className }: LayeredCardStackProps) {
  return (
    <div className={cn("relative", className)}>
      {cards.map((card, index) => (
        <div
          key={index}
          className={cn(
            "absolute",
            index === 0 && "relative z-30",
            index === 1 && "top-2 left-2 z-20 opacity-80",
            index === 2 && "top-4 left-4 z-10 opacity-60"
          )}
        >
          <DocumentCard
            title={card.title}
            subtitle={card.subtitle}
            icon={card.icon}
            highlight={card.highlight}
            className={cn(
              index === 0 && "w-full",
              index === 1 && "w-[calc(100%-8px)]",
              index === 2 && "w-[calc(100%-16px)]"
            )}
          />
        </div>
      ))}
    </div>
  );
}

interface GridCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GridCard({ children, className }: GridCardProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6", className)}>
      {children}
    </div>
  );
}
