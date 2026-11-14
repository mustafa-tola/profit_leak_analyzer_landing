import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Card({
  interactive = false,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-[14px] border border-line bg-surface shadow-soft transition-colors ${interactive ? 'hover:bg-subtle/60 cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export function CardHeader({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <div className={`px-5 py-4 sm:px-6 sm:py-4.5 border-b border-line ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export function CardBody({ className = '', children, ...props }: CardBodyProps) {
  return (
    <div className={`px-5 py-4 sm:px-6 sm:py-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export function CardFooter({ className = '', children, ...props }: CardFooterProps) {
  return (
    <div className={`border-t border-line px-5 py-4 sm:px-6 sm:py-4.5 ${className}`} {...props}>
      {children}
    </div>
  );
}
