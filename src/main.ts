import { bootstrapApplication } from '@angular/platform-browser';

import { xssDemoConfig } from './app/xss-demo.config';
import { XssDemoComponent } from './app/xss-demo.component';

bootstrapApplication(XssDemoComponent, xssDemoConfig)
  .catch((err) => console.error(err));