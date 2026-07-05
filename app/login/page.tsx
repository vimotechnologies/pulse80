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
} from "@/components/icons/LucideIcons";

const features = [
  {
    title: "Actionable Insights",
    description: "Turn health data into clear, actionable insights.",
    icon: UsersRound,
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
    icon: Stethoscope,
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
    <main className="flex h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,#E6F5FF_0%,#F6FAFD_38%,#FFFFFF_100%)] px-3 py-3 text-[#071633] sm:px-5 lg:px-6">
      <section className="mx-auto flex min-h-0 w-full max-w-[1780px] flex-1 flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/70 shadow-[0_18px_70px_rgba(7,22,51,0.10)] backdrop-blur-xl lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-0 overflow-hidden bg-[linear-gradient(135deg,#F8FCFF_0%,#EEF8FF_48%,#FFFFFF_100%)] px-6 py-6 sm:px-8 lg:px-10 lg:py-8 xl:px-12">
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
              <h1 className="max-w-[620px] text-3xl font-extrabold tracking-[-0.03em] text-[#071633] sm:text-4xl lg:text-[3.1rem] lg:leading-[1]">
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

        <div className="relative flex min-h-0 items-center justify-center bg-white px-6 py-6 sm:px-8 lg:px-10 xl:px-12">
          <div className="absolute right-6 top-5 flex items-center gap-5 text-xs font-medium text-[#445B7B]">
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

          <div className="w-full max-w-[640px] pt-8 lg:pt-6">
            <div>
              <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-[#071633] sm:text-3xl">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-[#526887]">
                Sign in to access your Pulse80 portal
              </p>
            </div>

            <form className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="text-xs font-bold text-[#071633]"
                >
                  Email address
                </label>

                <div className="mt-2 flex h-[52px] items-center gap-4 rounded-2xl border border-[#DDE8F3] bg-white px-5 shadow-sm transition focus-within:border-[#4AAAEA] focus-within:ring-4 focus-within:ring-[#4AAAEA]/10">
                  <Mail className="h-5 w-5 text-[#637896]" />
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="h-full flex-1 bg-transparent text-sm text-[#071633] outline-none placeholder:text-[#8090A7]"
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

                <div className="mt-2 flex h-[52px] items-center gap-4 rounded-2xl border border-[#DDE8F3] bg-white px-5 shadow-sm transition focus-within:border-[#4AAAEA] focus-within:ring-4 focus-within:ring-[#4AAAEA]/10">
                  <Lock className="h-5 w-5 text-[#637896]" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-full flex-1 bg-transparent text-sm text-[#071633] outline-none placeholder:text-[#8090A7]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="rounded-full p-2 text-[#637896] hover:bg-[#F6FAFD]"
                    aria-label="Toggle password visibility"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-3 text-sm font-medium text-[#445B7B]">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-[#DDE8F3] text-[#4AAAEA] focus:ring-[#4AAAEA]"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="button"
                className="group flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#1F73FF] to-[#0F63F4] text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow"
              >
                Sign in
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-[#637896]">
              Use the credentials provided by your platform administrator.
            </div>
          </div>
        </div>
      </section>

      <footer className="flex shrink-0 items-center justify-center gap-4 py-2 text-xs text-[#526887]">
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
