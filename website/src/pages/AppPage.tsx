import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, useAuth, useUser } from '@clerk/clerk-react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { WorkspaceHeader, MobileMenu } from '../components/layout/MobileMenu';
import { Badge } from '../components/ui/Badge';
import { DashboardView } from './views/DashboardView';
import { UploadView } from './views/UploadView';
import { ExceptionsView } from './views/ExceptionsView';
import { SettlementsView } from './views/SettlementsView';
import { ReportsView } from './views/ReportsView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { HelpView } from './views/HelpView';
import { apiUrl } from '../lib/api';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

type AppView =
  | 'dashboard'
  | 'upload'
  | 'exceptions'
  | 'settlements'
  | 'reports'
  | 'history'
  | 'settings'
  | 'help';

const VIEW_PATHS: Record<AppView, string> = {
  dashboard: '/app',
  upload: '/app/upload',
  exceptions: '/app/exceptions',
  settlements: '/app/settlements',
  reports: '/app/reports',
  history: '/app/history',
  settings: '/app/settings',
  help: '/app/help',
};

const PATH_VIEWS: Record<string, AppView> = {
  '/app': 'dashboard',
  '/app/upload': 'upload',
  '/app/exceptions': 'exceptions',
  '/app/settlements': 'settlements',
  '/app/reports': 'reports',
  '/app/history': 'history',
  '/app/settings': 'settings',
  '/app/help': 'help',
};

export function AppPage({ isDark }: { isDark: boolean }) {
  if (!clerkKey) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
        <div className="card p-6 sm:p-8">
          <p className="text-sm font-semibold text-accent-ink">Codvera workspace</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
            Live analysis setup required
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Set <code className="rounded bg-subtle px-1.5 py-0.5 text-ink">VITE_CLERK_PUBLISHABLE_KEY</code> and{' '}
            <code className="rounded bg-subtle px-1.5 py-0.5 text-ink">VITE_API_URL</code> in{' '}
            <code className="rounded bg-subtle px-1.5 py-0.5 text-ink">website/.env</code>, then restart the Vite dev server.
            The backend must be running with Clerk authentication enabled.
          </p>
          <p className="mt-3 text-sm text-muted">
            API target: <code className="rounded bg-subtle px-1.5 py-0.5 text-ink">{apiUrl()}</code>
          </p>
          <LinkToHome />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F8F7]">
      <SignedOut>
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:py-16">
          <section className="space-y-6">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted shadow-soft">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                Secure seller workspace
              </p>
              <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                Sign in to reconcile COD payments
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
                Upload seller, courier, and settlement exports to review expected receivables, verified payments, outstanding balances,
                and provisional exceptions in one evidence-led workspace.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2" aria-label="Workspace highlights">
              {[
                { title: 'Seller-scoped access', text: 'Runs and evidence stay isolated to the verified seller account.' },
                { title: 'Evidence-backed results', text: 'Findings are traceable to source data and never presented as confirmed loss.' },
                { title: 'Clear run quality', text: 'Clean, partial, and invalid settlement coverage are labeled explicitly.' },
                { title: 'Audit-friendly history', text: 'Revisit previous runs with preserved metadata and reconciliation outputs.' },
              ].map((item) => (
                <li key={item.title} className="card p-4">
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{item.text}</p>
                </li>
              ))}
            </ul>
          </section>
          <section aria-label="Sign in" className="card flex justify-center p-4 sm:p-6 lg:sticky lg:top-24">
            <SignIn
              routing="hash"
              signUpUrl="/app#/sign-up"
              forceRedirectUrl="/app"
              signUpForceRedirectUrl="/app"
            />
          </section>
        </div>
      </SignedOut>
      <SignedIn>
        <LiveAnalysisApp isDark={isDark} />
      </SignedIn>
    </main>
  );
}

function LinkToHome() {
  return (
    <a
      href="/"
      className="mt-6 inline-flex items-center text-sm font-semibold text-accent-ink underline-offset-4 hover:underline"
    >
      Back to home
    </a>
  );
}

function LiveAnalysisApp({ isDark }: { isDark: boolean }) {
  void isDark;
  const { getToken } = useAuth();
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<{ runId?: string; sellerId?: string; asOfDate?: string } | null>(null);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  const [view, setView] = useState<AppView>(() => PATH_VIEWS[location.pathname] ?? 'dashboard');

  // Track window width for reliable sidebar/hamburger visibility (CSS breakpoints can be unreliable with caching)
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync view with URL on location change
  useEffect(() => {
    const pathView = PATH_VIEWS[location.pathname] ?? 'dashboard';
    setView(pathView);
  }, [location.pathname]);

  const token = useCallback(async () => {
    const t = await getToken();
    if (!t) throw new Error('No Clerk session token is available. Sign in again.');
    return t;
  }, [getToken]);

  const onUpload = async (files: FileList) => {
    setError(null);
    try {
      const form = new FormData();
      for (const f of files) {
        form.append('files[]', f);
      }
      const res = await fetch(`${apiUrl()}/api/analyses`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await token()}` },
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
      const run = await res.json();
      setSelectedRun({ runId: run.run_id?.slice(0, 8), sellerId: run.seller_id, asOfDate: run.as_of_date ?? null });
      setView('dashboard');
      navigate(VIEW_PATHS.dashboard);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    }
  };

  const handleViewChange = (id: string) => {
    const viewId = id as AppView;
    setView(viewId);
    navigate(VIEW_PATHS[viewId]);
    setMobileMenuOpen(false);
  };

  const accountLabel = user?.primaryEmailAddress?.emailAddress ?? user?.id ?? 'Signed-in user';
  const orgLabel = 'Seller Workspace';

  const viewComponents: Record<AppView, React.ReactNode> = {
    dashboard: <DashboardView selected={selectedRun} />,
    upload: <UploadView onUpload={onUpload} />,
    exceptions: <ExceptionsView />,
    settlements: <SettlementsView />,
    reports: <ReportsView />,
    history: <HistoryView />,
    settings: <SettingsView />,
    help: <HelpView />,
  };

  const isDesktop = windowWidth >= 1024;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar: only in DOM on desktop, completely absent on mobile/tablet */}
      {isDesktop && (
        <aside className="sidebar w-72">
          <div className="sidebar-brand">
            <LogoMark />
            <span className="font-display font-semibold text-xl tracking-tight text-[#F5F8F7]">codvera</span>
          </div>

          <nav className="sidebar-nav" aria-label="Main navigation">
            {SIDEBAR_ITEMS.map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleViewChange(item.id)}
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
              onClick={() => handleViewChange('settings')}
              className={`w-full flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium transition text-left ${
                view === 'settings'
                  ? 'bg-[#DDF5EA] text-[#0A4236] shadow-sm'
                  : 'text-[#B8CBD4] hover:bg-[#11564B]/50 hover:text-white'
              }`}
              aria-current={view === 'settings' ? 'page' : undefined}
            >
              <SettingsIcon className="h-5 w-5" aria-hidden="true" />
              Settings
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('help')}
              className={`w-full flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium transition text-left ${
                view === 'help'
                  ? 'bg-[#DDF5EA] text-[#0A4236] shadow-sm'
                  : 'text-[#B8CBD4] hover:bg-[#11564B]/50 hover:text-white'
              }`}
              aria-current={view === 'help' ? 'page' : undefined}
            >
              <HelpIcon className="h-5 w-5" aria-hidden="true" />
              Help & Support
            </button>
          </div>

          <div className="px-4 py-4 border-t border-line/30">
            <div className="flex items-center gap-3 rounded-[14px] px-3 py-3 bg-[#11564B]/40">
              <UserIcon className="h-5 w-5 shrink-0 text-[#B8CBD4]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#F5F8F7]">{accountLabel}</p>
                <p className="text-xs text-[#B8CBD4]">{orgLabel}</p>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main content area: full width on mobile/tablet, shares row with sidebar on desktop */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <WorkspaceHeader
          view={view}
          selected={selectedRun}
          isMobileMenuOpen={isMobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          isDesktop={isDesktop}
        />

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
          {error && (
            <div className="mb-6 rounded-[14px] border border-[#B42318]/30 bg-[#FEF3F2] px-4 py-3.5 text-sm text-[#B42318] sm:px-5" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="ml-2">Unable to complete request: {error}</span>
            </div>
          )}
          {viewComponents[view]}
        </div>
      </main>

      {/* Mobile menu overlay: covers entire screen when open, only renders on mobile/tablet */}
      {!isDesktop && (
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          accountLabel={accountLabel}
          orgLabel={orgLabel}
          activeView={view}
          onViewChange={handleViewChange}
        />
      )}
    </div>
  );
}

const SIDEBAR_ITEMS: Array<{
  id: AppView;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutIcon className="h-5 w-5" aria-hidden="true" /> },
  { id: 'upload', label: 'Upload & Analyze', icon: <UploadIcon className="h-5 w-5" aria-hidden="true" /> },
  { id: 'exceptions', label: 'Exceptions', icon: <ShieldAlertIcon className="h-5 w-5" aria-hidden="true" />, badge: 87 },
  { id: 'settlements', label: 'Settlements', icon: <FileCheckIcon className="h-5 w-5" aria-hidden="true" /> },
  { id: 'reports', label: 'Reports', icon: <FileTextIcon className="h-5 w-5" aria-hidden="true" /> },
  { id: 'history', label: 'Previous Runs', icon: <HistoryIcon className="h-5 w-5" aria-hidden="true" /> },
];

function LayoutIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="3" /></svg>;
}

function UploadIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
}

function ShieldAlertIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 1c-4 0-7.5 1-7.5 7.5S8 16 12 16s7.5-4 7.5-7.5S16 1 12 1z" /><path d="M12 17v-6" /><path d="M12 9h.01" /></svg>;
}

function FileCheckIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M17 13l2 2 4-4" /></svg>;
}

function FileTextIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
}

function HistoryIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}

function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82-.33l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82-.33h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-1-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1 1.51z" /></svg>;
}

function HelpIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="1" /><path d="M12 17v.01M12 13v6" /></svg>;
}

function UserIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 68 68" aria-hidden="true" className="shrink-0">
      <path d="M43 16H27c-4 0-7 2-10 5L8 30c-3 3-3 8 0 11l9 9c3 3 8 3 11 0l8-8" fill="none" stroke="#087F62" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 47l10 10c3 3 8 3 11 0l15-17" fill="none" stroke="#103E36" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
