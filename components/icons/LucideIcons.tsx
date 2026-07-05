import {
  Activity as LucideActivity,
  ArrowDownRight as LucideArrowDownRight,
  ArrowRight as LucideArrowRight,
  ArrowUpRight as LucideArrowUpRight,
  BarChart3 as LucideBarChart3,
  Bell as LucideBell,
  Building2 as LucideBuilding2,
  CalendarCheck as LucideCalendarCheck,
  CalendarDays as LucideCalendarDays,
  ChevronDown as LucideChevronDown,
  ClipboardCheck as LucideClipboardCheck,
  Clock as LucideClock,
  CreditCard as LucideCreditCard,
  Eye as LucideEye,
  FileBarChart as LucideFileBarChart,
  FileText as LucideFileText,
  Globe2 as LucideGlobe2,
  HeartPulse as LucideHeartPulse,
  Inbox as LucideInbox,
  LayoutDashboard as LucideLayoutDashboard,
  Lightbulb as LucideLightbulb,
  Lock as LucideLock,
  Mail as LucideMail,
  Menu as LucideMenu,
  Microscope as LucideMicroscope,
  Search as LucideSearch,
  Settings as LucideSettings,
  ShieldCheck as LucideShieldCheck,
  Sparkles as LucideSparkles,
  Stethoscope as LucideStethoscope,
  Sun as LucideSun,
  UsersRound as LucideUsersRound,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

export type { LucideIcon };

function withStrokeWidth(Icon: LucideIcon): LucideIcon {
  function StrokeWidthIcon({ strokeWidth, ...props }: LucideProps) {
    return <Icon strokeWidth={strokeWidth ?? 1.25} {...props} />;
  }

  return StrokeWidthIcon as LucideIcon;
}

export const Activity = withStrokeWidth(LucideActivity);
export const ArrowDownRight = withStrokeWidth(LucideArrowDownRight);
export const ArrowRight = withStrokeWidth(LucideArrowRight);
export const ArrowUpRight = withStrokeWidth(LucideArrowUpRight);
export const BarChart3 = withStrokeWidth(LucideBarChart3);
export const Bell = withStrokeWidth(LucideBell);
export const Building2 = withStrokeWidth(LucideBuilding2);
export const CalendarCheck = withStrokeWidth(LucideCalendarCheck);
export const CalendarDays = withStrokeWidth(LucideCalendarDays);
export const ChevronDown = withStrokeWidth(LucideChevronDown);
export const ClipboardCheck = withStrokeWidth(LucideClipboardCheck);
export const Clock = withStrokeWidth(LucideClock);
export const CreditCard = withStrokeWidth(LucideCreditCard);
export const Eye = withStrokeWidth(LucideEye);
export const FileBarChart = withStrokeWidth(LucideFileBarChart);
export const FileText = withStrokeWidth(LucideFileText);
export const Globe2 = withStrokeWidth(LucideGlobe2);
export const HeartPulse = withStrokeWidth(LucideHeartPulse);
export const Inbox = withStrokeWidth(LucideInbox);
export const LayoutDashboard = withStrokeWidth(LucideLayoutDashboard);
export const Lightbulb = withStrokeWidth(LucideLightbulb);
export const Lock = withStrokeWidth(LucideLock);
export const Mail = withStrokeWidth(LucideMail);
export const Menu = withStrokeWidth(LucideMenu);
export const Microscope = withStrokeWidth(LucideMicroscope);
export const Search = withStrokeWidth(LucideSearch);
export const Settings = withStrokeWidth(LucideSettings);
export const ShieldCheck = withStrokeWidth(LucideShieldCheck);
export const Sparkles = withStrokeWidth(LucideSparkles);
export const Stethoscope = withStrokeWidth(LucideStethoscope);
export const Sun = withStrokeWidth(LucideSun);
export const UsersRound = withStrokeWidth(LucideUsersRound);
