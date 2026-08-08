export interface SiteConfigRepository {
  getPublic(): Promise<Array<{ key: string; value: unknown }> | null>;
}
