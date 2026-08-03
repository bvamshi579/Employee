import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { RuntimeConfigService } from './services/runtime-config.service';
import { API_BASE } from './app.tokens';
import { environment } from '../environments/environment';

export function loadRuntimeConfigFactory(rc: RuntimeConfigService) {
  return () => rc.load();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    RuntimeConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: loadRuntimeConfigFactory,
      deps: [RuntimeConfigService],
      multi: true
    },
    {
      provide: API_BASE,
      useFactory: (rc: RuntimeConfigService) => rc.apiBase || environment.apiBase || '' ,
      deps: [RuntimeConfigService]
    }
  ]
};
