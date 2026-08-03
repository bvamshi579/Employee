import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  apiBase = '';

  async load(): Promise<void> {
    try {
      const resp = await fetch('/assets/runtime-config.json', { cache: 'no-store' });
      if (!resp.ok) throw new Error('Failed to load runtime config');
      const json = await resp.json();
      this.apiBase = json.apiBase || '';
    } catch (e) {
      // fallback: keep empty - services may fallback to environment values
      console.warn('Runtime config load failed, falling back to defaults', e);
      this.apiBase = '';
    }
  }
}
