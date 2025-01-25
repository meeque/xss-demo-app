import { enableProdMode, importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withNoXsrfProtection } from '@angular/common/http';

import { PayloadOutputService } from './app/payload-output.service';
import { XssDemoComponent } from './app/xss-demo.component';

import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(XssDemoComponent, {
    providers: [
        importProvidersFrom(BrowserModule, FormsModule),
        PayloadOutputService,
        provideHttpClient(withNoXsrfProtection())
    ]
})
  .catch(err => console.error(err));
