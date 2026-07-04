import Link from "next/link";
import {
  Activity,
  BarChart3,
  Building2,
  ChevronDown,
  Eye,
  FileText,
  Globe2,
  HeartPulse,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
  Sun,
  UserRound,
  UsersRound,
} from "lucide-react";
import { PulseLogo } from "@/components/brand/PulseLogo";
import { cn } from "@/lib/utils/cn";

const features = [
  {
    title: "Actionable Insights",
    description: "Turn workforce health data into clear decisions.",
    icon: UsersRound,
    tone: "bg-primary/10 text-primary ring-primary/20",
  },
  {
    title: "Prevent. Protect. Perform.",
    description: "Reduce health risk and boost workforce resilience.",
    icon: ShieldCheck,
    tone: "bg-pulse-red/10 text-pulse-red ring-pulse-red/15",
  },
  {
    title: "Powerful Reports",
    description: "Access executive-ready wellness reports anytime.",
    icon: FileText,
    tone: "bg-success/10 text-success ring-success/20",
  },
  {
    title: "Trusted Practitioner Network",
    description: "Coordinate verified healthcare professionals.",
    icon: Stethoscope,
    tone: "bg-primary-light/15 text-primary ring-primary-light/30",
  },
];

const stats = [
  { value: "200+", label: "Organizations", icon: Building2 },
  { value: "50K+", label: "Lives Impacted", icon: UsersRound },
  { value: "1M+", label: "Screenings Conducted", icon: Activity },
  { value: "98%", label: "Client Retention", icon: BarChart3 },
];

const portals = [
  {
    title: "Admin",
    subtitle: "Operations Portal",
    icon: UserRound,
    selected: true,
  },
  {
    title: "Client",
    subtitle: "Organization Portal",
    icon: Building2,
    selected: false,
  },
  {
    title: "Practitioner",
    subtitle: "Practitioner Portal",
    icon: Stethoscope,
    selected: false,
  },
];

export default function LoginPage() {
  return (
    <main className="pulse-login-shell flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      <div className="pulse-login-card grid w-full max-w-[92rem] overflow-hidden rounded-[2rem] border border-surface/80 shadow-[0_28px_90px_var(--elevated-shadow)] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.04fr_0.96fr] 2xl:min-h-[56rem]">
        <section className="relative overflow-hidden px-6 py-8 sm:px-9 sm:py-10 lg:px-14 lg:py-12">
          <div className="relative z-10 flex min-h-full flex-col">
            <PulseLogo variant="full" priority className="max-h-24" />

            <div className="mt-12 max-w-xl lg:mt-16">
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-navy sm:text-5xl lg:text-[3.4rem]">
                Smarter wellness. Stronger workplaces.
              </h1>
              <p className="mt-6 max-w-md text-base leading-8 text-subtle">
                Pulse80 is the enterprise wellness intelligence platform that
                helps organizations improve employee health, reduce risk, and
                drive measurable impact.
              </p>
            </div>

            <div className="mt-9 grid max-w-xl gap-5">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <span
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1",
                      feature.tone,
                    )}
                  >
                    <feature.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-navy">
                      {feature.title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-subtle">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pulse-health-visual relative mt-10 min-h-72 overflow-hidden rounded-[2rem] border border-surface/70 shadow-[0_24px_70px_var(--card-shadow)] lg:absolute lg:bottom-24 lg:right-8 lg:mt-0 lg:h-[28rem] lg:w-[30rem]">
              <div className="absolute right-8 top-9 z-10 rounded-3xl border border-card-border bg-surface/90 px-5 py-4 shadow-[0_18px_50px_var(--card-shadow)] backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Wellness Index
                </p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-3xl font-semibold text-navy">82</span>
                  <span className="pb-1 text-sm font-medium text-success">+12%</span>
                </div>
              </div>

              <div className="absolute bottom-10 left-8 z-10 flex items-center gap-3 rounded-3xl border border-card-border bg-surface/90 px-4 py-3 shadow-[0_18px_50px_var(--card-shadow)] backdrop-blur">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <HeartPulse className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy">Risk reviewed</p>
                  <p className="text-xs text-muted">Onsite screening ready</p>
                </div>
              </div>

              <div className="absolute bottom-8 right-10 z-10 h-32 w-32 rounded-full bg-primary/10" />
              <div className="absolute bottom-16 right-16 z-10 h-24 w-24 rounded-full bg-surface/80 shadow-[inset_0_0_0_1px_var(--card-border)]" />
              <Stethoscope
                className="absolute bottom-24 right-24 z-10 h-12 w-12 text-primary"
                aria-hidden="true"
              />

              <svg
                className="absolute right-0 top-1/2 z-10 h-32 w-72 -translate-y-1/2 text-pulse-red opacity-70"
                viewBox="0 0 280 120"
                role="img"
                aria-label="Pulse line"
              >
                <path
                  d="M8 62H68L82 26L105 92L128 16L151 92L174 44L188 62H272"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="8"
                />
              </svg>
            </div>

            <div className="relative z-20 mt-8 grid gap-3 rounded-[1.5rem] border border-surface/80 bg-surface/90 p-4 shadow-[0_22px_70px_var(--card-shadow)] backdrop-blur sm:grid-cols-2 lg:mt-auto lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 rounded-2xl px-2 py-2 lg:border-r lg:border-card-border last:lg:border-r-0"
                >
                  <stat.icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-lg font-semibold text-navy">{stat.value}</p>
                    <p className="text-xs leading-5 text-subtle">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface/90 px-6 py-8 shadow-[inset_1px_0_0_var(--card-border)] sm:px-9 sm:py-10 lg:px-14 lg:py-12">
          <div className="mb-12 flex items-center justify-end gap-3">
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-subtle transition hover:bg-soft-bg hover:text-navy"
              aria-label="Select language"
            >
              <Globe2 className="h-4 w-4" aria-hidden="true" />
              English
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-subtle transition hover:bg-soft-bg hover:text-navy"
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mx-auto max-w-[43rem]">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight text-navy">
                Welcome back
              </h2>
              <p className="mt-3 text-base text-subtle">
                Sign in to access your Pulse80 portal
              </p>
            </div>

            <form className="mt-9 space-y-7">
              <fieldset>
                <legend className="sr-only">Choose portal</legend>
                <div className="grid gap-3 xl:grid-cols-3">
                  {portals.map((portal) => (
                    <button
                      key={portal.title}
                      type="button"
                      aria-pressed={portal.selected}
                      className={cn(
                        "flex min-h-24 items-center gap-4 rounded-2xl border bg-surface p-4 text-left transition",
                        portal.selected
                          ? "border-primary bg-primary/10 shadow-[0_16px_42px_var(--card-shadow)]"
                          : "border-card-border hover:border-primary/40 hover:bg-soft-bg",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                          portal.selected
                            ? "bg-primary/10 text-primary"
                            : "bg-soft-bg text-muted",
                        )}
                      >
                        <portal.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-navy">
                          {portal.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-subtle">
                          {portal.subtitle}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className="text-sm font-semibold text-navy">Email address</span>
                <span className="relative mt-3 block">
                  <Mail className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    className="h-16 w-full rounded-2xl border border-card-border bg-surface pl-14 pr-5 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-navy">Password</span>
                <span className="relative mt-3 block">
                  <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                  <input
                    type="password"
                    className="h-16 w-full rounded-2xl border border-card-border bg-surface pl-14 pr-14 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-soft-bg hover:text-navy"
                    aria-label="Show password"
                  >
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  </button>
                </span>
              </label>

              <div className="flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3 text-navy">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded-md border-card-border accent-primary"
                  />
                  Remember me
                </label>
                <a href="#" className="font-medium text-primary hover:text-navy">
                  Forgot password?
                </a>
              </div>

              <Link
                href="/admin/dashboard"
                className="flex h-16 w-full items-center justify-center rounded-2xl bg-primary px-5 text-base font-semibold text-white shadow-[0_18px_44px_var(--primary-shadow)] transition hover:bg-primary-light"
              >
                Sign in
              </Link>

              <div className="flex items-center gap-4">
                <span className="h-px flex-1 bg-card-border" />
                <span className="text-sm text-muted">or continue with</span>
                <span className="h-px flex-1 bg-card-border" />
              </div>

              <button
                type="button"
                className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl border border-card-border bg-surface px-5 text-base font-semibold text-navy transition hover:bg-soft-bg"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-card-border text-sm font-bold text-primary">
                  G
                </span>
                Continue with Google
              </button>
            </form>

            <p className="mt-9 text-center text-sm text-subtle">
              Don&apos;t have an account?{" "}
              <a href="#" className="font-semibold text-primary hover:text-navy">
                Contact your administrator
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
