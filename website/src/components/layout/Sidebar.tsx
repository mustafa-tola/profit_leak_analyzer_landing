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
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" aria-hidden="true" /> },
  { id: 'upload', label: 'Upload & Analyze', icon: <FileUp className="h-5 w-5" aria-hidden="true" /> },
  { id: 'exceptions', label: 'Exceptions', icon: <ShieldAlert className="h-5 w-5" aria-hidden="true" /> },
  { id: 'settlements', label: 'Settlements', icon: <FileCheck className="h-5 w-5" aria-hidden="true" /> },
  { id: 'reports', label: 'Reports', icon: <FileText className="h-5 w-5" aria-hidden="true" /> },
  { id: 'history', label: 'Previous Runs', icon: <History className="h-5 w-5" aria-hidden="true" /> },
];

interface SidebarProps {
  accountLabel: string;
  orgLabel: string;
  activeView: string;
  onViewChange: (id: string) => void;
  onClose?: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
}

export function Sidebar({
  accountLabel,
  orgLabel,
  activeView,
  onViewChange,
  onClose,
  isMobile = false,
  isOpen = true,
}: SidebarProps) {
  const location = useLocation();

  const isActive = (id: string) => activeView === id || location.pathname === `/app/${id}`;

  // Mobile sidebar: slide in from left with translate-x animation
  const mobileClasses = isMobile
    ? `fixed inset-y-0 left-0 z-[60] w-[260px] transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`
    : '';

  return (
    <aside className={`sidebar ${mobileClasses}`}>
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-line/30">
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#B8CBD4] hover:text-[#F5F8F7] hover:bg-[#11564B]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDF5EA]/50"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <LogoMark />
        <span className="font-display font-semibold text-xl tracking-tight text-[#F5F8F7]">codvera</span>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
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
              className={`w-full flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium transition text-left ${
                active
                  ? 'bg-[#DDF5EA] text-[#0A4236] shadow-sm'
                  : 'text-[#B8CBD4] hover:bg-[#11564B]/50 hover:text-white'
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
          className={`w-full flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium transition text-left ${
            activeView === 'settings'
              ? 'bg-[#DDF5EA] text-[#0A4236] shadow-sm'
              : 'text-[#B8CBD4] hover:bg-[#11564B]/50 hover:text-white'
          }`}
          aria-current={activeView === 'settings' ? 'page' : undefined}
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
          Settings
        </button>
        <button
          type="button"
          onClick={() => {
            onViewChange('help');
            onClose?.();
          }}
          className={`w-full flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium transition text-left ${
            activeView === 'help'
              ? 'bg-[#DDF5EA] text-[#0A4236] shadow-sm'
              : 'text-[#B8CBD4] hover:bg-[#11564B]/50 hover:text-white'
          }`}
          aria-current={activeView === 'help' ? 'page' : undefined}
        >
          <HelpCircle className="h-5 w-5" aria-hidden="true" />
          Help & Support
        </button>
      </div>

      <div className="px-4 py-4 border-t border-line/30">
        <div className="flex items-center gap-3 rounded-[14px] px-3 py-3 bg-[#11564B]/40">
          <User className="h-5 w-5 shrink-0 text-[#B8CBD4]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#F5F8F7]">{accountLabel}</p>
            <p className="text-xs text-[#B8CBD4]">{orgLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 68 68" aria-hidden="true" className="shrink-0">
      <path d="M43 16H27c-4 0-7 2-10 5L8 30c-3 3-3 8 0 11l9 9c3 3 8 3 11 0l8-8" fill="none" stroke="#087F62" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 47l10 10c3 3 8 3 11 0l15-17" fill="none" stroke="#103E36" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
