import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { XssDemoComponent } from './xss-demo.component';
import { ComboboxInputComponent } from './combobox-input.component'
import { PayloadOutputComponent } from './payload-output.component';
import { PayloadOutputService } from './payload-output.service';

@NgModule({
  declarations: [
    XssDemoComponent,
    ComboboxInputComponent,
    PayloadOutputComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    PayloadOutputService
  ],
  bootstrap: [XssDemoComponent]
})
export class XssDemoModule {
}
