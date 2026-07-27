"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { loginAction } from "@/app/actions/auth";
import {
  ArrowRight,
  Eye,
  EyeSlash,
  Lock,
  Mail,
  ShieldCheck,
} from "@/components/icons/IconsaxIcons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await loginAction({ email, password, remember });
    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      return;
    }

    router.replace(result.destination);
    router.refresh();
  }

  return (
    <main className="pulse-login-page relative flex h-[100dvh] max-h-[100dvh] items-center justify-center overflow-hidden bg-[#f7f8fa] px-4 py-3 text-navy sm:px-8 sm:py-6">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#142B53_0%,#142B53_78%,#BA1325_78%,#BA1325_100%)]" />
      <div className="pointer-events-none absolute -left-40 -top-48 h-[430px] w-[430px] rounded-full border-[74px] border-navy/[0.035]" />
      <div className="pointer-events-none absolute -bottom-52 -right-36 h-[480px] w-[480px] rounded-full border-[82px] border-pulse-red/[0.045]" />

      <div className="relative w-full max-w-[480px]">
        <div className="pulse-login-logo mb-2 flex justify-center sm:mb-4">
          <div className="relative h-[76px] w-full max-w-[330px] sm:h-[96px] sm:max-w-[370px]">
            <Image
              src="/brand/pulse80-logo-full.svg"
              alt="Pulse80 — workplace wellness insights reimagined"
              fill
              sizes="390px"
              priority
              className="object-contain"
            />
          </div>
        </div>

        <section className="pulse-login-card rounded-[20px] border border-[#dfe3e8] bg-white p-4 shadow-[0_18px_48px_rgba(20,43,83,0.08)] sm:rounded-[24px] sm:p-7">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pulse-red">
              Secure portal access
            </p>
            <p className="mt-3 text-[13px] leading-6 text-navy/60">
              Sign in to continue to your Pulse80 workspace.
            </p>
          </div>

          <form className="pulse-login-form mt-5 space-y-3.5 sm:mt-6 sm:space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="text-[12px] font-semibold text-navy">
                Email address
              </label>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-[#d8dde5] bg-white px-4 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
                <Mail className="h-[18px] w-[18px] shrink-0 text-navy/45" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  className="pulse-login-input h-full min-w-0 flex-1 bg-transparent text-[13px] text-navy outline-none placeholder:text-navy/35"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="password" className="text-[12px] font-semibold text-navy">
                  Password
                </label>
                <button type="button" className="text-[11px] font-semibold text-pulse-red transition hover:text-navy">
                  Forgot password?
                </button>
              </div>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-[#d8dde5] bg-white px-4 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
                <Lock className="h-[18px] w-[18px] shrink-0 text-navy/45" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="pulse-login-input h-full min-w-0 flex-1 bg-transparent text-[13px] text-navy outline-none placeholder:text-navy/35"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-navy/45 transition hover:bg-navy/8 hover:text-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeSlash className="h-[18px] w-[18px]" aria-hidden="true" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex w-fit items-center gap-2.5 text-[11px] font-medium text-navy/65">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 rounded border-[#cbd2dc] text-primary focus:ring-primary"
              />
              Keep me signed in on this device
            </label>

            {error ? (
              <div role="alert" className="rounded-xl border border-pulse-red/15 bg-pulse-red/7 px-4 py-3 text-[11px] font-semibold text-pulse-red">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="pulse-sign-in group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 text-[13px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-pulse-red active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in securely"}
              <ArrowRight className="h-[18px] w-[18px] transition group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </form>

          <div className="pulse-login-footer mt-4 flex items-center justify-center gap-2 border-t border-[#e3e6eb] pt-3 text-[10px] text-navy/45 sm:mt-5 sm:pt-4">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Protected Pulse80 environment
          </div>
        </section>

      </div>
    </main>
  );
}
