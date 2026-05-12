import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import type { PhoneCountryMode } from "@shared/user-phone";
import { normalizeUserPhone } from "@shared/user-phone";

export default function AccountSettings() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [phoneMode, setPhoneMode] = useState<PhoneCountryMode>("ke");
  const [phoneValue, setPhoneValue] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name?.trim() ?? "");
    const p = user.phone?.trim();
    if (p?.startsWith("+254")) {
      setPhoneMode("ke");
      setPhoneValue(p.slice(4));
    } else if (p) {
      setPhoneMode("intl");
      setPhoneValue(p);
    } else {
      setPhoneValue("");
    }
  }, [user]);

  const updateProfile = trpc.auth.updateMyProfile.useMutation({
    onSuccess: async () => {
      setProfileMessage({ type: "ok", text: "Your details were saved." });
      await utils.auth.me.invalidate();
    },
    onError: (e) => setProfileMessage({ type: "err", text: e.message }),
  });

  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      setPasswordMessage({ type: "ok", text: "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e) => setPasswordMessage({ type: "err", text: e.message }),
  });

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setProfileMessage({ type: "err", text: "Please enter your name." });
      return;
    }
    if (phoneValue.trim()) {
      const n = normalizeUserPhone({ mode: phoneMode, value: phoneValue });
      if (!n) {
        setProfileMessage({
          type: "err",
          text:
            phoneMode === "ke"
              ? "Kenya: enter 9 digits (e.g. 712345678 or 0712345678)."
              : "International: include country code (e.g. +447700900123).",
        });
        return;
      }
    }
    updateProfile.mutate({
      name: trimmed,
      phoneMode,
      phoneValue: phoneValue.trim() === "" ? "" : phoneValue,
    });
  };

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "err", text: "New passwords do not match." });
      return;
    }
    changePassword.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Account settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update the name shown on certificates and your sign-in password.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
            <CardDescription>
              Use your full name exactly as you want it on course certificates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              {profileMessage && (
                <p
                  className={`text-sm ${profileMessage.type === "ok" ? "text-green-600 dark:text-green-500" : "text-destructive"}`}
                >
                  {profileMessage.text}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="acct-name">Full name</Label>
                <Input
                  id="acct-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile (optional)</Label>
                <Select value={phoneMode} onValueChange={(v) => setPhoneMode(v as PhoneCountryMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ke">Kenya (+254)</SelectItem>
                    <SelectItem value="intl">Outside Kenya</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder={phoneMode === "ke" ? "712345678 or 0712345678" : "+44… full international number"}
                  value={phoneValue}
                  onChange={(e) => setPhoneValue(e.target.value)}
                  autoComplete="tel"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank if you prefer not to add a number. We use it for course reminders when you enroll.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Email: {user.email}</p>
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving…" : "Save details"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>At least 8 characters, with letters and numbers.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitPassword} className="space-y-4">
              {passwordMessage && (
                <p
                  className={`text-sm ${passwordMessage.type === "ok" ? "text-green-600 dark:text-green-500" : "text-destructive"}`}
                >
                  {passwordMessage.text}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="cur-pw">Current password</Label>
                <Input
                  id="cur-pw"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pw">New password</Label>
                <Input
                  id="new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conf-pw">Confirm new password</Label>
                <Input
                  id="conf-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" variant="secondary" disabled={changePassword.isPending}>
                {changePassword.isPending ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm">
          <Link href="/forgot-password" className="text-primary underline">
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
}
