import React, { useState } from 'react';
import { User, ShieldCheck, Bell, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsView() {
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleReset = () => {
    if (resetConfirm) {
      // In a production app this would call an API to clear all runs/uploads.
      setResetConfirm(false);
    } else {
      setResetConfirm(true);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <SettingsSection
        title="Account"
        description="Manage your seller profile and organization settings."
        icon={<User className="h-5 w-5" aria-hidden="true" />}
      >
        <SettingRow label="Seller ID" value="SELLER-DEMO" type="text" />
        <SettingRow label="Business Name" value="Demo Seller Account" type="text" />
        <SettingRow label="Organization Slug" value="seller-demo" type="text" />
        <SettingRow label="Primary Email" value="seller@demo.example.com" type="email" />
      </SettingsSection>

      <SettingsSection
        title="Security"
        description="Authentication and access control for your workspace."
        icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
      >
        <SettingRow label="Authentication Method" value="Clerk (OAuth)" type="text" />
        <SettingRow label="Session Timeout" value="24 hours" type="text" />
        <SettingRow label="Two-Factor Authentication" value="Not enabled" type="text" />
        <SettingRow label="Allowed Origins" value="http://localhost:5173" type="text" />
      </SettingsSection>

      <SettingsSection
        title="Notifications"
        description="Configure alert preferences for analysis runs and exceptions."
        icon={<Bell className="h-5 w-5" aria-hidden="true" />}
      >
        <SettingRow label="Analysis Complete" value="Enabled" type="text" />
        <SettingRow label="New Exceptions" value="Enabled" type="text" />
        <SettingRow label="Weekly Summary" value="Disabled" type="text" />
        <SettingRow label="Email Notifications" value="seller@demo.example.com" type="text" />
      </SettingsSection>

      <SettingsSection
        title="Data & Export"
        description="Manage data retention, exports, and workspace preferences."
        icon={<FileText className="h-5 w-5" aria-hidden="true" />}
      >
        <SettingRow label="Data Retention Policy" value="90 days" type="text" />
        <SettingRow label="Default Export Format" value="CSV" type="text" />
        <SettingRow label="Auto-run Analysis on Upload" value="Enabled" type="text" />
        <SettingRow label="Time Zone" value="Asia/Karachi (PKT)" type="text" />
      </SettingsSection>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-ink">Reset Workspace</p>
              <p className="text-sm text-muted">Clear all runs, uploads, and cached data. This action cannot be undone.</p>
            </div>
            <div className="flex items-center gap-2">
              {resetConfirm ? (
                <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2">
                  <AlertCircle className="h-4 w-4 text-danger" aria-hidden="true" />
                  <span className="text-xs font-medium text-danger">Click again to confirm reset</span>
                </div>
              ) : (
                <Button variant="danger" size="sm" onClick={handleReset}>
                  Reset Workspace
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
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
      <CardBody>{children}</CardBody>
    </Card>
  );
}

function SettingRow({ label, value, type }: { label: string; value: string; type: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 hover:bg-[#F5F8F7] transition">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-xs font-medium text-muted">{type}</span>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-ink truncate max-w-xs">{value}</p>
        <button type="button" className="text-xs font-medium text-accent-ink hover:underline ml-2">Edit</button>
      </div>
    </div>
  );
}
