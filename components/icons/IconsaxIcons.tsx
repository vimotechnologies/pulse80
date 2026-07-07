import type { ComponentType, SVGAttributes } from "react";
import {
  Activity as IconsaxActivity,
  ArrowDown as IconsaxArrowDown,
  ArrowLeft2 as IconsaxArrowLeft2,
  ArrowRight as IconsaxArrowRight,
  ArrowUp as IconsaxArrowUp,
  Buildings as IconsaxBuildings,
  CalendarTick as IconsaxCalendarTick,
  Card as IconsaxCard,
  Chart2 as IconsaxChart2,
  ClipboardTick as IconsaxClipboardTick,
  Clock as IconsaxClock,
  DocumentText as IconsaxDocumentText,
  Eye as IconsaxEye,
  Health as IconsaxHealth,
  Heart as IconsaxHeart,
  LampOn as IconsaxLampOn,
  Lock as IconsaxLock,
  Menu as IconsaxMenu,
  Microscope as IconsaxMicroscope,
  Notification as IconsaxNotification,
  Profile2User as IconsaxProfile2User,
  SearchNormal1 as IconsaxSearch,
  Setting2 as IconsaxSettings,
  ShieldTick as IconsaxShieldTick,
  Sms as IconsaxSms,
  StatusUp as IconsaxStatusUp,
  Sun1 as IconsaxSun,
  TaskSquare as IconsaxTaskSquare,
  Warning2 as IconsaxWarning2,
  type IconProps as IconsaxProps,
} from "iconsax-react";

export type IconsaxIcon = ComponentType<IconsaxProps>;

type AppIconProps = Omit<IconsaxProps, "variant"> & SVGAttributes<SVGElement>;

function withDefaultVariant(Icon: IconsaxIcon): IconsaxIcon {
  function AppIcon({ color, size, ...props }: AppIconProps) {
    return (
      <Icon
        color={color ?? "currentColor"}
        size={size ?? 24}
        variant="Linear"
        {...props}
      />
    );
  }

  return AppIcon as IconsaxIcon;
}

export const Activity = withDefaultVariant(IconsaxActivity);
export const AlertCircle = withDefaultVariant(IconsaxWarning2);
export const ArrowDownRight = withDefaultVariant(IconsaxArrowDown);
export const ArrowLeft2 = withDefaultVariant(IconsaxArrowLeft2);
export const ArrowRight = withDefaultVariant(IconsaxArrowRight);
export const ArrowUpRight = withDefaultVariant(IconsaxArrowUp);
export const BarChart3 = withDefaultVariant(IconsaxChart2);
export const Bell = withDefaultVariant(IconsaxNotification);
export const Building2 = withDefaultVariant(IconsaxBuildings);
export const CalendarCheck = withDefaultVariant(IconsaxCalendarTick);
export const CalendarDays = withDefaultVariant(IconsaxCalendarTick);
export const ChevronDown = withDefaultVariant(IconsaxArrowDown);
export const ClipboardCheck = withDefaultVariant(IconsaxClipboardTick);
export const Clock = withDefaultVariant(IconsaxClock);
export const CreditCard = withDefaultVariant(IconsaxCard);
export const Eye = withDefaultVariant(IconsaxEye);
export const FileBarChart = withDefaultVariant(IconsaxDocumentText);
export const FileText = withDefaultVariant(IconsaxDocumentText);
export const Globe2 = withDefaultVariant(IconsaxStatusUp);
export const HeartPulse = withDefaultVariant(IconsaxHeart);
export const Inbox = withDefaultVariant(IconsaxTaskSquare);
export const LayoutDashboard = withDefaultVariant(IconsaxChart2);
export const Lightbulb = withDefaultVariant(IconsaxLampOn);
export const Lock = withDefaultVariant(IconsaxLock);
export const Mail = withDefaultVariant(IconsaxSms);
export const Menu = withDefaultVariant(IconsaxMenu);
export const Microscope = withDefaultVariant(IconsaxMicroscope);
export const Search = withDefaultVariant(IconsaxSearch);
export const Settings = withDefaultVariant(IconsaxSettings);
export const ShieldCheck = withDefaultVariant(IconsaxShieldTick);
export const Sparkles = withDefaultVariant(IconsaxStatusUp);
export const Stethoscope = withDefaultVariant(IconsaxHealth);
export const Sun = withDefaultVariant(IconsaxSun);
export const UsersRound = withDefaultVariant(IconsaxProfile2User);
