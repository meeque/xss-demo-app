import { bootstrapApplication } from '@angular/platform-browser';

import { xssDemoConfig } from './xss/xss-demo.config';
import { XssDemoComponent } from './xss/xss-demo.component';

bootstrapApplication(XssDemoComponent, xssDemoConfig)
  .catch((err) => console.error(err));