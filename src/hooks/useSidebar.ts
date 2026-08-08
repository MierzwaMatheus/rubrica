import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useI18n } from "@/i18n/context/I18nContext";
import {
  SidebarRepository,
  SidebarContactInfo,
} from "@/repositories/interfaces/SidebarRepository";

export function useSidebar(repository: SidebarRepository) {
  const { locale } = useI18n();

  const { data: contactInfoRaw, isLoading } = useQuery({
    queryKey: ["sidebar", "contact"],
    queryFn: () => repository.getContactInfo(),
    staleTime: Infinity,
  });

  const contactRole = useMemo(() => {
    if (!contactInfoRaw) return "";
    return (
      contactInfoRaw.role_translations?.[locale] ||
      contactInfoRaw.role_translations?.["pt-BR"] ||
      contactInfoRaw.role ||
      ""
    );
  }, [contactInfoRaw, locale]);

  const contactInfo = useMemo((): SidebarContactInfo | null => {
    if (!contactInfoRaw) return null;
    return {
      ...contactInfoRaw,
      role: contactRole,
    };
  }, [contactInfoRaw, contactRole]);

  return {
    contactInfo,
    isLoading,
  };
}
