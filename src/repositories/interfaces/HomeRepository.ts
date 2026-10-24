import type { HomeMetric } from "@/utils/homeMetrics";
import type { WorkPrinciple } from "@/utils/aboutContent";

export interface ContactInfo {
  name?: string;
  role: string;
  role_translations?: Record<string, string>;
  email?: string;
  show_email?: boolean;
  phone?: string;
  show_phone?: boolean;
}

export interface AboutData {
  value: Record<string, string>;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  title_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  image_url: string;
  role_translations?: Record<string, string>;
  text_translations?: Record<string, string>;
  category?: string;
}

export interface AvailabilityData {
  available: boolean;
  label?: Record<string, string>;
}

export interface HomeRepository {
  getContactInfo(): Promise<ContactInfo | null>;
  getAboutData(): Promise<AboutData | null>;
  getServices(): Promise<Service[]>;
  getTestimonials(): Promise<Testimonial[]>;
  getAvailability(): Promise<AvailabilityData | null>;
  getContactWizardEnabled(): Promise<boolean>;
  /** Princípios de trabalho (homeContent `work_principles`), exibidos em Sobre. */
  getWorkPrinciples(): Promise<WorkPrinciple[]>;
  getHomeMetrics(): Promise<HomeMetric[]>;
}

