/** Ícones do menu por nome (os plugins declaram o nome do Lucide em `admin[].icon`). */
import {
  Briefcase, BriefcaseBusiness, CircleHelp, CreditCard, ShieldCheck, CalendarDays, FilePen, Files, FileSignature, GraduationCap, History, House, Image, Inbox, KeyRound, Languages, Newspaper, Palette,
  Puzzle, Quote, Scroll, Settings, Sparkles, Tags, UserCog, Users, Circle, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase, "briefcase-business": BriefcaseBusiness, "circle-help": CircleHelp, "shield-check": ShieldCheck, "calendar-days": CalendarDays, "credit-card": CreditCard, "file-pen": FilePen, files: Files, "file-signature": FileSignature,
  "graduation-cap": GraduationCap, history: History, house: House, image: Image, inbox: Inbox, "key-round": KeyRound,
  languages: Languages, newspaper: Newspaper, palette: Palette, puzzle: Puzzle, quote: Quote, scroll: Scroll,
  settings: Settings, sparkles: Sparkles, tags: Tags, "user-cog": UserCog, users: Users,
};

export function MenuIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Circle;
  return <Icon className={className} aria-hidden="true" />;
}
