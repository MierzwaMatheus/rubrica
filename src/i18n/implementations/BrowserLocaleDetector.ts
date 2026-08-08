import { LocaleDetector } from '../interfaces/LocaleDetector';

export class BrowserLocaleDetector implements LocaleDetector {
  async detect(): Promise<string> {
    return this.detectSync();
  }
  
  detectSync(): string {
    const browserLang = navigator.language || 'en-US';
    if (browserLang.startsWith('pt')) {
      return 'pt-BR';
    }
    return 'en-US';
  }
}


