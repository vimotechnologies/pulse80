"use client";

import { useState } from "react";

import {
  updatePractitionerPassword,
  updatePractitionerProfile,
  type PractitionerProfile,
} from "@/app/actions/practitioner-profile";
import { Bell, Lock } from "@/components/icons/IconsaxIcons";
import { ActionButton } from "@/components/portal/ActionButton";
import { DashboardWidget } from "@/components/portal/DashboardWidget";
import { FormInput } from "@/components/portal/FormInput";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";

export function PractitionerSettingsPage({ initialProfile }: { initialProfile: PractitionerProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [password, setPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function showMessage(value: string) {
    setMessage(value);
    window.setTimeout(() => setMessage(null), 3200);
  }

  async function savePassword() {
    setSavingPassword(true);
    const result = await updatePractitionerPassword(password);
    setSavingPassword(false);
    if (!result.ok) {
      showMessage(result.error);
      return;
    }
    setPassword("");
    showMessage("Password updated.");
  }

  async function savePreferences() {
    setSavingPreferences(true);
    const result = await updatePractitionerProfile({
      fullName: profile.fullName,
      professionalEmail: profile.professionalEmail,
      phone: profile.phone ?? "",
      country: profile.country,
      city: profile.city ?? "",
      preferredContactMethod: profile.preferredContactMethod,
      specialisation: profile.specialisation ?? "",
      yearsExperience: profile.yearsExperience,
      qualifications: profile.qualifications,
      assignmentNotifications: profile.assignmentNotifications,
      documentNotifications: profile.documentNotifications,
      paymentNotifications: profile.paymentNotifications,
    });
    setSavingPreferences(false);
    if (!result.ok) {
      showMessage(result.error);
      return;
    }
    setProfile(result.profile);
    showMessage("Notification preferences saved.");
  }

  return (
    <div className="space-y-7">
      <PortalPageHeader
        eyebrow="Health Practitioner"
        title="Settings"
        description="Manage your password and notification preferences."
      />

      <DashboardWidget>
        <div className="flex items-center gap-2 border-b border-card-border px-5 py-4">
          <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-navy">Account & security</h2>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <div>
            <FormInput
              label="New password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
            <ActionButton
              variant="secondary"
              className="mt-3"
              loading={savingPassword}
              onClick={savePassword}
            >
              Update password
            </ActionButton>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
              <p className="text-xs font-semibold text-navy">Notification preferences</p>
            </div>
            <PreferenceToggle
              label="Assignment reminders"
              checked={profile.assignmentNotifications}
              onChange={(assignmentNotifications) => setProfile({ ...profile, assignmentNotifications })}
            />
            <PreferenceToggle
              label="Document expiry alerts"
              checked={profile.documentNotifications}
              onChange={(documentNotifications) => setProfile({ ...profile, documentNotifications })}
            />
            <PreferenceToggle
              label="Payment updates"
              checked={profile.paymentNotifications}
              onChange={(paymentNotifications) => setProfile({ ...profile, paymentNotifications })}
            />
            <ActionButton
              variant="secondary"
              loading={savingPreferences}
              onClick={savePreferences}
            >
              Save preferences
            </ActionButton>
          </div>
        </div>
      </DashboardWidget>

      {message ? (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-card-border bg-white px-4 py-3 text-sm font-semibold text-navy shadow-xl">
          {message}
        </div>
      ) : null}
    </div>
  );
}

function PreferenceToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-card-border px-3 py-2 text-sm text-navy">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-primary"
      />
    </label>
  );
}
