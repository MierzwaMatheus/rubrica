import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useI18n } from "@/i18n/context/I18nContext";
import {
  HomeRepository,
  ContactInfo,
  Service,
  Testimonial,
} from "@/repositories/interfaces/HomeRepository";

export function useHome(repository: HomeRepository) {
  const { locale } = useI18n();

  const { data: contactInfo, isLoading: isLoadingContact } = useQuery({
    queryKey: ["home", "contact"],
    queryFn: () => repository.getContactInfo(),
    staleTime: Infinity,
  });

  const { data: aboutDataRaw, isLoading: isLoadingAbout } = useQuery({
    queryKey: ["home", "about"],
    queryFn: () => repository.getAboutData(),
    staleTime: Infinity,
  });

  const { data: servicesRaw, isLoading: isLoadingServices } = useQuery({
    queryKey: ["home", "services"],
    queryFn: () => repository.getServices(),
    staleTime: Infinity,
  });

  const { data: testimonialsRaw, isLoading: isLoadingTestimonials } = useQuery({
    queryKey: ["home", "testimonials"],
    queryFn: () => repository.getTestimonials(),
    staleTime: Infinity,
  });

  const { data: availabilityRaw, isLoading: isLoadingAvailability } = useQuery({
    queryKey: ["home", "availability"],
    queryFn: () => repository.getAvailability(),
    staleTime: Infinity,
  });

  const { data: contactWizardEnabled = true } = useQuery({
    queryKey: ["home", "contact_wizard_enabled"],
    queryFn: () => repository.getContactWizardEnabled(),
    staleTime: Infinity,
  });

  const isLoading =
    isLoadingContact ||
    isLoadingAbout ||
    isLoadingServices ||
    isLoadingTestimonials ||
    isLoadingAvailability;

  // Deriva role traduzido baseado no locale atual (sem refetch)
  const contactName = contactInfo?.name ?? "";

  const contactRole = useMemo(() => {
    if (!contactInfo) return "";
    return (
      contactInfo.role_translations?.[locale] ||
      contactInfo.role_translations?.["pt-BR"] ||
      contactInfo.role ||
      ""
    );
  }, [contactInfo, locale]);

  // Deriva aboutText baseado no locale atual (sem fazer fetch)
  const aboutText = useMemo(() => {
    if (!aboutDataRaw?.value) return "";
    return aboutDataRaw.value[locale] || aboutDataRaw.value["pt-BR"] || "";
  }, [aboutDataRaw, locale]);

  // Deriva services traduzidos baseado no locale atual (sem fazer fetch)
  const services = useMemo(() => {
    if (!servicesRaw) return [];

    return servicesRaw.map(service => ({
      ...service,
      title:
        service.title_translations?.[locale] ||
        service.title_translations?.["pt-BR"] ||
        service.title ||
        "",
      description:
        service.description_translations?.[locale] ||
        service.description_translations?.["pt-BR"] ||
        service.description ||
        "",
    }));
  }, [servicesRaw, locale]);

  // Deriva testimonials traduzidos baseado no locale atual (sem fazer fetch)
  const testimonials = useMemo(() => {
    if (!testimonialsRaw) return [];

    return testimonialsRaw.map(testimonial => ({
      ...testimonial,
      name: testimonial.name || "",
      role:
        testimonial.role_translations?.[locale] ||
        testimonial.role_translations?.["pt-BR"] ||
        testimonial.role ||
        "",
      text:
        testimonial.text_translations?.[locale] ||
        testimonial.text_translations?.["pt-BR"] ||
        testimonial.text ||
        "",
    }));
  }, [testimonialsRaw, locale]);

  const availability = useMemo(() => {
    if (!availabilityRaw) return null;
    return {
      available: availabilityRaw.available,
      label:
        availabilityRaw.label?.[locale] ||
        availabilityRaw.label?.["pt-BR"] ||
        null,
    };
  }, [availabilityRaw, locale]);

  return {
    contactName,
    contactRole,
    aboutText,
    services,
    testimonials,
    availability,
    contactWizardEnabled,
    isLoading,
    contactInfo: contactInfo ?? null,
  };
}
