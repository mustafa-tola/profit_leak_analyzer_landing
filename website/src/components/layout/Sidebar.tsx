import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileUp,
  History,
  ShieldAlert,
  FileCheck,
  FileText,
  Settings,
  HelpCircle,
  User,
  X,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
};

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> },
  { id: 'upload', label: 'Upload & Analyze', icon: <FileUp className="h-4 w-4" aria-hidden="true" /> },
  { id: 'exceptions', label: 'Exceptions', icon: <ShieldAlert className="h-4 w-4" aria-hidden="true" /> },
  { id: 'settlements', label: 'Settlements', icon: <FileCheck className="h-4 w-4" aria-hidden="true" /> },
  { id: 'reports', label: 'Reports', icon: <FileText className="h-4 w-4" aria-hidden="true" /> },
  { id: 'history', label: 'Previous Runs', icon: <History className="h-4 w-4" aria-hidden="true" /> },
];

interface SidebarProps {
  accountLabel: string;
  orgLabel: string;
  activeView: string;
  onViewChange: (id: string) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export function Sidebar({
  accountLabel,
  orgLabel,
  activeView,
  onViewChange,
  onClose,
  isMobile = false,
}: SidebarProps) {
  const location = useLocation();

  const isActive = (id: string) => activeView === id || location.pathname === `/app/${id}`;

  const mobileClasses = isMobile ? 'h-full max-w-full overflow-y-auto' : '';

  return (
    <aside className={`sidebar ${mobileClasses}`}>
      <div className="flex items-center gap-2 px-3 py-3.5 border-b border-line/30">
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-ink"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <LogoMark />
        <span className="font-display font-semibold text-lg tracking-tight text-ink dark:text-white">codvera</span>
      </div>

      <nav className="sidebar-nav p-2" aria-label="Main navigation">
        {SIDEBAR_ITEMS.map((item) => {
          const active = isActive(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onViewChange(item.id);
                onClose?.();
              }}
              className={`w-full flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-medium transition text-left ${
                active
                  ? 'bg-accent-soft text-accent-ink dark:bg-accent/30 dark:text-accent shadow-sm'
                  : 'text-muted hover:bg-subtle hover:text-ink dark:text-muted/60 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <Badge variant="partial" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          onClick={() => {
            onViewChange('settings');
            onClose?.();
          }}
          className={`w-full flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-medium transition text-left ${
            activeView === 'settings'
              ? 'bg-accent-soft text-accent-ink dark:bg-accent/30 dark:text-accent shadow-sm'
              : 'text-muted hover:bg-subtle hover:text-ink dark:text-muted/60 dark:hover:bg-white/10 dark:hover:text-white'
          }`}
          aria-current={activeView === 'settings' ? 'page' : undefined}
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          Settings
        </button>
        <button
          type="button"
          onClick={() => {
            onViewChange('help');
            onClose?.();
          }}
          className={`w-full flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-medium transition text-left ${
            activeView === 'help'
              ? 'bg-accent-soft text-accent-ink dark:bg-accent/30 dark:text-accent shadow-sm'
              : 'text-muted hover:bg-subtle hover:text-ink dark:text-muted/60 dark:hover:bg-white/10 dark:hover:text-white'
          }`}
          aria-current={activeView === 'help' ? 'page' : undefined}
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          Help & Support
        </button>
      </div>

      <div className="px-2 py-3 border-t border-line/30">
        <div className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2.5 bg-accent/20 dark:bg-accent/10">
          <User className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-ink dark:text-white">{accountLabel}</p>
            <p className="text-xs text-muted">{orgLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function LogoMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 68 68" aria-hidden="true" className="shrink-0">
      <path d="M43 16H27c-4 0-7 2-10 5L8 30c-3 3-3 8 0 11l9 9c3 3 8 3 11 0l8-8" fill="none" stroke="#087F62" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 47l10 10c3 3 8 3 11 0l15-17" fill="none" stroke="#103E36" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
