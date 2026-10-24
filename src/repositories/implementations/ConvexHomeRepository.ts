import { parseHomeMetrics, type HomeMetric } from "@/utils/homeMetrics";
import { ConvexHttpClient } from "convex/browser";
import {
  HomeRepository,
  ContactInfo,
  AboutData,
  Service,
  Testimonial,
  AvailabilityData,
} from "../interfaces/HomeRepository";
import {
  mapContactInfo,
  mapService,
  mapTestimonial,
  mapTranslations,
} from "../mappers/convexMappers";
import { api } from "../../../convex/_generated/api";
import { parseWorkPrinciples, type WorkPrinciple } from "@/utils/aboutContent";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL as string);

export class ConvexHomeRepository implements HomeRepository {
  async getContactInfo(): Promise<ContactInfo | null> {
    const data = await client.query(api.contactInfo.get, {});
    return data ? mapContactInfo(data) : null;
  }

  async getAboutData(): Promise<AboutData | null> {
    const data = await client.query(api.homeContent.getByKey, {
      key: "about_text",
    });
    if (!data) return { value: {} };
    const value = (data as any).value ?? {};
    return { value: mapTranslations(value) ?? {} };
  }

  async getServices(): Promise<Service[]> {
    const data = await client.query(api.services.list, {});
    return Array.isArray(data) ? data.map(mapService) : [];
  }

  async getTestimonials(): Promise<Testimonial[]> {
    const data = await client.query(api.testimonials.list, { onlyHome: true });
    return Array.isArray(data) ? data.map(mapTestimonial) : [];
  }

  async getAvailability(): Promise<AvailabilityData | null> {
    const data = await client.query(api.homeContent.getByKey, {
      key: "availability_status",
    });
    if (!data) return null;
    const value = (data as any).value ?? {};
    return {
      available: Boolean(value.available),
      label: value.label ?? {},
    };
  }

  async getContactWizardEnabled(): Promise<boolean> {
    const data = await client.query(api.homeContent.getByKey, {
      key: "contact_wizard_enabled",
    });
    if (!data) return true;
    return (data as any).value !== false;
  }

  async getWorkPrinciples(): Promise<WorkPrinciple[]> {
    const data = await client.query(api.homeContent.getByKey, { key: "work_principles" });
    return parseWorkPrinciples((data as any)?.value);
  }

  async getHomeMetrics(): Promise<HomeMetric[]> {
    const data = await client.query(api.homeContent.getByKey, { key: "home_metrics" });
    return parseHomeMetrics((data as any)?.value);
  }
}
