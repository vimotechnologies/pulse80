import Image from "next/image";
import { brand } from "@/lib/constants/brand";
import { cn } from "@/lib/utils/cn";

type PulseLogoProps = {
  variant?: "full" | "no-tagline" | "mark";
  className?: string;
  priority?: boolean;
};

const logoConfig = {
  full: {
    src: brand.assets.logoFull,
    alt: "Pulse80 logo",
    width: 260,
    height: 92,
  },
  "no-tagline": {
    src: brand.assets.logoNoTagline,
    alt: "Pulse80",
    width: 190,
    height: 58,
  },
  mark: {
    src: brand.assets.mark,
    alt: "Pulse80 mark",
    width: 44,
    height: 44,
  },
};

export function PulseLogo({
  variant = "no-tagline",
  className,
  priority,
}: PulseLogoProps) {
  const logo = logoConfig[variant];

  return (
    <Image
      src={logo.src}
      alt={logo.alt}
      width={logo.width}
      height={logo.height}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}
