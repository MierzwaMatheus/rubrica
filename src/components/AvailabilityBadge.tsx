import { Briefcase } from "lucide-react";
import { useTranslation } from "@/i18n/hooks/useTranslation";

interface AvailabilityBadgeProps {
  label?: string | null;
}

export function AvailabilityBadge({ label }: AvailabilityBadgeProps) {
  const { t } = useTranslation();
  const displayLabel = label || t("home.availability.label");

  return (
    <div className="inline-flex items-center px-4 py-1.5 mb-6 bg-neon-lime/10 border border-neon-lime/30 rounded-full backdrop-blur-sm">
      <span className="w-2 h-2 rounded-full bg-neon-lime mr-2 animate-pulse shadow-[0_0_8px_color-mix(in_srgb,var(--accent)_60%,transparent)]" />
      <Briefcase className="w-3 h-3 text-neon-lime mr-2" />
      <p className="text-sm font-medium text-neon-lime font-mono">
        {displayLabel}
      </p>
    </div>
  );
}
