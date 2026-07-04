import Link from "next/link";
import { ArrowRight, Building2, Lock, Mail, ShieldCheck, Stethoscope } from "lucide-react";
import { PulseLogo } from "@/components/brand/PulseLogo";
import { cn } from "@/lib/utils/cn";

const portals = ["Admin", "Client Organization", "Health Practitioner"];
const highlights = [
  "Onsite preventive healthcare screening coordination",
  "Verified health practitioner network management",
  "Executive wellness, absenteeism, presenteeism, and ROI reporting",
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-soft-bg lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="pulse-login-panel relative flex min-h-[46rem] flex-col justify-between overflow-hidden bg-navy px-6 py-8 text-white before:absolute before:inset-0 sm:px-10 lg:min-h-screen lg:px-14">
        <div className="relative">
          <div className="inline-flex rounded-lg bg-surface px-4 py-3 shadow-[0_20px_70px_var(--elevated-shadow)]">
            <PulseLogo variant="full" priority className="max-h-20" />
          </div>
        </div>
        <div className="relative max-w-2xl py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-light">
            Enterprise wellness intelligence
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            Smarter wellness. Stronger workplaces.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-navy-soft">
            Pulse80 helps organizations coordinate preventive healthcare, manage
            onsite screenings, connect with verified practitioners, and access
            actionable wellness reports.
          </p>
          <div className="mt-8 grid gap-3">
            {highlights.map((highlight) => (
              <div key={highlight} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <ShieldCheck className="h-4 w-4 text-primary-light" aria-hidden="true" />
                </span>
                <p className="text-sm leading-6 text-navy-soft">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative grid gap-3 sm:grid-cols-3">
          {[
            ["42", "Client organizations"],
            ["31k+", "Employees reached"],
            ["126", "Verified practitioners"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg border border-surface/15 bg-surface/10 p-4">
              <p className="text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-xs leading-5 text-navy-soft">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md rounded-lg border border-card-border bg-surface p-6 shadow-[0_24px_80px_var(--elevated-shadow)] sm:p-8">
          <div>
            <p className="text-sm font-semibold text-primary">Welcome back</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-navy">
              Sign in to Pulse80
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Select your portal and continue to your workspace.
            </p>
          </div>

          <form className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium text-navy">Portal</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {portals.map((portal, index) => (
                  <button
                    key={portal}
                    type="button"
                    className={cn(
                      "min-h-12 rounded-lg border px-3 text-xs font-semibold transition sm:min-h-16",
                      index === 0
                        ? "border-primary bg-primary/10 text-navy"
                        : "border-card-border bg-surface text-muted hover:border-primary/50",
                    )}
                  >
                    {portal}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-navy">Email</span>
              <span className="relative mt-2 block">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  className="h-11 w-full rounded-lg border border-card-border pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="name@company.com"
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-navy">Password</span>
              <span className="relative mt-2 block">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  className="h-11 w-full rounded-lg border border-card-border pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="Enter password"
                />
              </span>
            </label>

            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="flex items-center gap-2 text-subtle">
                <input type="checkbox" className="h-4 w-4 rounded border-card-border accent-primary" />
                Remember me
              </label>
              <a href="#" className="font-medium text-primary hover:text-navy">
                Forgot password?
              </a>
            </div>

            <Link
              href="/admin/dashboard"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-light"
            >
              Sign in
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <button
              type="button"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-card-border bg-surface px-4 text-sm font-semibold text-navy transition hover:bg-soft-bg"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-card-border text-xs font-bold">
                G
              </span>
              Continue with Google
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 border-t border-card-border pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2 text-muted">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Enterprise access
            </span>
            <a href="#" className="font-medium text-primary hover:text-navy">
              Contact administrator
            </a>
          </div>
          <Stethoscope className="sr-only" />
        </div>
      </section>
    </main>
  );
}
