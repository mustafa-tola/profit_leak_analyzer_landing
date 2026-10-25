import React from 'react';

type SectionHeaderProps = {
  id: string;
  title: string;
  description: string;
  onDark?: boolean;
  aside?: React.ReactNode;
};

export function SectionHeader({ id, title, description, onDark = false, aside }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <h2
          id={id}
          className={`text-3xl font-semibold tracking-tight sm:text-4xl ${onDark ? 'text-white' : 'text-ink'}`}>
          
          {title}
        </h2>
        <p className={`mt-4 text-base leading-relaxed sm:text-lg ${onDark ? 'text-white/70' : 'text-muted'}`}>
          {description}
        </p>
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>);

}