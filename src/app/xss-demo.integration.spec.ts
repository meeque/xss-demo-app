import { TestBed, ComponentFixture } from '@angular/core/testing';
import { xssDemoConfig } from './xss-demo.config';
import { XssDemoComponent } from './xss-demo.component';

describe('Xss Demo App', () => {

  let fixture : ComponentFixture<XssDemoComponent>;
  let component : XssDemoComponent;
  let element : HTMLElement;

  let payloadInputComboBox;
  let payloadOutputComboBox;
  let alertOverlay;

  function timeout(millis : number) : Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, millis));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule(xssDemoConfig);
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(XssDemoComponent);
    fixture.detectChanges();

    component = fixture.componentInstance;
    element = fixture.nativeElement;

    payloadInputComboBox = element.querySelector('section.input-area combobox-input');
    payloadOutputComboBox = element.querySelector('section.output-area combobox-input');
    alertOverlay = element.querySelector('.fd-shell__overlay.fd-overlay--alert')
  });

  it('should be created', () => {
    expect(component).toBeDefined();
  });

  it('with image onerror input and raw HTML output should trigger XSS', async () => {
    const doXssSpy = spyOn(component, 'doXss').and.callThrough();
    await fixture.whenStable();
    const inputLink = Array.from(payloadInputComboBox.querySelectorAll('div.fd-popover__body a'))
        .find((a : HTMLLinkElement) => a.textContent == 'Image onerror') as HTMLLinkElement;
    inputLink.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const outputLink = Array.from(payloadOutputComboBox.querySelectorAll('div.fd-popover__body a'))
        .find((a : HTMLLinkElement) => a.textContent.trim() == 'Raw HTML') as HTMLLinkElement;
    outputLink.click();
    await fixture.whenStable();
    fixture.detectChanges();
    await doXssSpy;
    await timeout(1000);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(alertOverlay.querySelector('.alert-xss-triggered')).not.toBeNull();
  });
});