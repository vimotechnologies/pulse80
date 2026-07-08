"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  FileText,
  Globe2,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
  Sun,
  UsersRound,
} from "@/components/icons/IconsaxIcons";

const features = [
  {
    title: "Actionable Insights",
    description: "Turn health data into clear, actionable insights.",
    icon: Stethoscope,
    color: "blue",
  },
  {
    title: "Prevent. Protect. Perform.",
    description: "Prevent health risks and boost workforce performance.",
    icon: ShieldCheck,
    color: "red",
  },
  {
    title: "Powerful Reports",
    description: "Access comprehensive reports anytime, anywhere.",
    icon: FileText,
    color: "green",
  },
  {
    title: "Trusted Practitioner Network",
    description: "Work with licensed healthcare professionals.",
    icon: UsersRound,
    color: "purple",
  },
];

function iconTone(color: string) {
  switch (color) {
    case "red":
      return "bg-red-50 text-[#D51439] ring-red-100";
    case "green":
      return "bg-emerald-50 text-emerald-600 ring-emerald-100";
    case "purple":
      return "bg-violet-50 text-violet-600 ring-violet-100";
    default:
      return "bg-blue-50 text-blue-600 ring-blue-100";
  }
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,#E6F5FF_0%,#F6FAFD_38%,#FFFFFF_100%)] px-2 py-2 text-[#071633] sm:px-5 sm:py-3 lg:px-6">
      <section className="mx-auto flex min-h-0 w-full max-w-[1780px] flex-1 flex-col overflow-hidden rounded-[22px] border border-white/80 bg-white/70 shadow-[0_18px_70px_rgba(7,22,51,0.10)] backdrop-blur-xl sm:rounded-[28px] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-0 overflow-hidden bg-[linear-gradient(135deg,#F8FCFF_0%,#EEF8FF_48%,#FFFFFF_100%)] px-6 py-6 sm:px-8 lg:block lg:px-10 lg:py-8 xl:px-12">
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#DDF1FF]/70 blur-3xl" />
          <div className="absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-[#EAF7FF]/80 blur-3xl" />

          <div className="relative z-10">
            <div className="relative h-[76px] w-[300px] max-w-full sm:h-[88px] sm:w-[340px]">
              <Image
                src="/brand/pulse80-logo-full.png"
                alt="Pulse80"
                fill
                sizes="(max-width: 640px) 300px, 340px"
                priority
                className="object-contain object-left"
              />
            </div>

            <div className="mt-8 max-w-[620px] lg:mt-10">
              <h1 className="max-w-[620px] text-xl font-extrabold tracking-[var(--pulse-tracking-display)] text-[#071633] lg:leading-[1]">
                Smarter wellness.
                <br />
                Stronger workplaces.
              </h1>

              <p className="mt-4 max-w-[520px] text-sm leading-6 text-[#3E5575]">
                Pulse80 is the enterprise wellness intelligence platform that
                helps organizations improve employee health, reduce risk and
                drive measurable impact.
              </p>
            </div>

            <div className="mt-7 grid max-w-[560px] gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div key={feature.title} className="flex items-start gap-5">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${iconTone(
                        feature.color
                      )}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#071633]">
                        {feature.title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-[#526887]">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-white px-5 py-4 sm:px-8 sm:py-6 lg:px-10 xl:px-12">
          <div className="absolute right-6 top-5 hidden items-center gap-5 text-xs font-medium text-[#445B7B] sm:flex">
            <button
              type="button"
              className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-[#F6FAFD]"
            >
              <Globe2 className="h-4 w-4" />
              English
              <span className="text-xs">⌄</span>
            </button>

            <button
              type="button"
              aria-label="Toggle theme"
              className="rounded-full p-2 hover:bg-[#F6FAFD]"
            >
              <Sun className="h-5 w-5" />
            </button>
          </div>

          <div className="flex min-h-0 w-full max-w-[640px] flex-col justify-center sm:min-h-full sm:py-10 lg:block lg:min-h-0 lg:py-0 lg:pt-6">
            <div className="relative mx-auto mb-[30px] h-[78px] w-[330px] max-w-full sm:mb-8 sm:h-[72px] sm:w-[280px] lg:hidden">
              <Image
                src="/brand/pulse80-logo-full.png"
                alt="Pulse80"
                fill
                sizes="(max-width: 640px) 330px, 280px"
                priority
                className="object-contain object-center"
              />
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-extrabold tracking-[var(--pulse-tracking-title)] text-[#071633]">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-[#526887]">
                Sign in to access your Pulse80 portal
              </p>
            </div>

            <form className="mt-5 space-y-4 sm:mt-7 sm:space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="text-xs font-bold text-[#071633]"
                >
                  Email address
                </label>

                <div className="pulse-login-field relative mt-2 h-11 overflow-hidden rounded-2xl border border-[#DDE8F3] bg-white shadow-sm transition focus-within:border-[#4AAAEA] focus-within:ring-4 focus-within:ring-[#4AAAEA]/10 sm:h-[52px]">
                  <Mail className="pointer-events-none absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#637896]" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    className="pulse-login-input h-full w-full rounded-2xl bg-transparent pl-14 pr-5 text-sm text-[#071633] outline-none placeholder:text-[#8090A7]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="text-xs font-bold text-[#071633]"
                >
                  Password
                </label>

                <div className="pulse-login-field relative mt-2 h-11 overflow-hidden rounded-2xl border border-[#DDE8F3] bg-white shadow-sm transition focus-within:border-[#4AAAEA] focus-within:ring-4 focus-within:ring-[#4AAAEA]/10 sm:h-[52px]">
                  <Lock className="pointer-events-none absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#637896]" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="pulse-login-input h-full w-full rounded-2xl bg-transparent pl-14 pr-14 text-sm text-[#071633] outline-none placeholder:text-[#8090A7]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-[#637896] hover:bg-[#F6FAFD]"
                    aria-label="Toggle password visibility"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs font-medium text-[#445B7B] sm:gap-3 sm:text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#DDE8F3] text-[#4AAAEA] focus:ring-[#4AAAEA] sm:h-5 sm:w-5"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 sm:text-sm"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="button"
                className="group flex h-11 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#1F73FF] to-[#0F63F4] text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow sm:h-[52px]"
              >
                Sign in
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </button>
            </form>

            <div className="mt-3 text-center text-xs text-[#637896] sm:mt-5">
              Use the credentials provided by your platform administrator.
            </div>
          </div>
        </div>
      </section>

      <footer className="hidden shrink-0 items-center justify-center gap-4 py-2 text-xs text-[#526887] lg:flex">
        <ShieldCheck className="h-4 w-4" />
        <span>Your data is secure and private.</span>
        <span className="h-4 w-px bg-[#DDE8F3]" />
        <button
          type="button"
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Privacy Policy
        </button>
      </footer>
    </main>
  );
}
