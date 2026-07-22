import { PulseLogo } from "@/components/brand/PulseLogo";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-soft-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-[#d0d5dd] bg-surface shadow-[0_16px_40px_var(--card-shadow)]">
          <PulseLogo variant="mark" priority className="max-h-10" />
        </div>
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-primary/15">
          <div className="h-full w-1/2 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
