import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withNoXsrfProtection } from '@angular/common/http';

import { PayloadPresetService } from './payload-preset.service';
import { PayloadOutputService } from './payload-output.service';

export const xssDemoConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(BrowserModule, FormsModule),
    PayloadPresetService,
    PayloadOutputService,
    provideHttpClient(withNoXsrfProtection()),
  ],
};
