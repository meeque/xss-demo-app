import { enableProdMode, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';


import { environment } from './environments/environment';
import { PayloadOutputService } from './app/payload-output.service';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { withInterceptorsFromDi, provideHttpClient } from '@angular/common/http';
import { XssDemoComponent } from './app/xss-demo.component';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(XssDemoComponent, {
    providers: [
        importProvidersFrom(BrowserModule, FormsModule),
        PayloadOutputService,
        provideHttpClient(withInterceptorsFromDi())
    ]
})
  .catch(err => console.error(err));
