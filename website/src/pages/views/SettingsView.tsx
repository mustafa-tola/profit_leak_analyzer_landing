import React from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { AlertCircle, ArrowRight, Bell, FileText, LogOut, ShieldCheck, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { apiUrl } from '../../lib/api';

interface SettingsViewProps {
  sellerId?: string;
  onViewChange: (id: string) => void;
}

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsView({ sellerId, onViewChange }: SettingsViewProps) {
  const { signOut } = useAuth();
  const { user } = useUser();

  return (
    <div className="max-w-2xl space-y-6">
      <SettingsSection
        title="Account"
        description="Identity supplied by your verified Clerk session."
        icon={<User className="h-5 w-5" aria-hidden="true" />}
      >
        <SettingRow label="Signed in as" value={user?.primaryEmailAddress?.emailAddress ?? user?.username ?? user?.id ?? 'Signed-in user'} />
        <SettingRow label="User ID" value={user?.id ?? '—'} />
        <SettingRow label="Seller ID" value={sellerId ?? 'Set by your organization claim; appears in run results'} />
        <SettingRow label="Account management" value="Use the avatar menu in the header" />
      </SettingsSection>

      <SettingsSection
        title="Security"
        description="Authentication and access control for your workspace."
        icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
      >
        <SettingRow label="Authentication" value="Clerk" />
        <SettingRow label="Seller authorization" value="Verified from the session token on every request" />
        <SettingRow label="Data access" value="Scoped to your seller identity" />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">End your session</p>
            <p className="text-xs text-muted">Sign out of this workspace on this device.</p>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<LogOut className="h-4 w-4" aria-hidden="true" />} onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Workspace"
        description="Live service configuration for this prototype."
        icon={<FileText className="h-5 w-5" aria-hidden="true" />}
      >
        <SettingRow label="API endpoint" value={apiUrl()} />
        <SettingRow label="Exports" value="CSV (summary, exceptions, settlement evidence)" />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">Need help with your runs?</p>
            <p className="text-xs text-muted">Open the workspace guide and file-format requirements.</p>
          </div>
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />} onClick={() => onViewChange('help')}>
            Help &amp; Support
          </Button>
        </div>
      </SettingsSection>

      <Card>
        <CardBody>
          <div className="flex items-start gap-3 rounded-lg border border-warn/30 bg-warn-soft/40 px-4 py-3 text-sm text-muted">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
            <p>
              This academic prototype does not provide editable profile fields, notification preferences or a
              workspace reset. Analysis runs and uploaded evidence are stored by the API; retention and deletion
              policies are still pending.
            </p>
          </div>
        </CardBody>
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted">
        <Bell className="h-3.5 w-3.5" aria-hidden="true" />
        Run status alerts appear in the notification menu in the header.
      </p>
    </div>
  );
}

function SettingsSection({ title, description, icon, children }: SettingsSectionProps) {
  return (
    <Card>
      <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-line">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0FBF7] text-[#0A4236]">{icon}</div>
          <div>
            <h3 className="font-display text-base font-semibold text-ink sm:text-lg">{title}</h3>
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          </div>
        </div>
      </div>
      <CardBody className="space-y-3">{children}</CardBody>
    </Card>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 transition hover:bg-[#F5F8F7]">
      <span className="text-sm font-medium text-ink">{label}</span>
      <p className="max-w-xs truncate text-right text-sm text-muted" title={value}>{value}</p>
    </div>
  );
}
