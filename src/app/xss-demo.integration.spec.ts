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

  function timeout(millis: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, millis));
  }

  function spyOnAndCallThroughAndPromise(object: any, method: string): Promise<any> {
    let spyCallResolve: (value: any) => void;
    const spyInvokePromise = new Promise<any>((resolve) => spyCallResolve = resolve );
    const methodImpl = object[method];
    spyOn(object, method).and.callFake((... invokeArgs) => spyCallResolve(methodImpl(... invokeArgs)));
    return spyInvokePromise;
  }

  async function select(input: string, output: string) {
    const payloadInputMenuLink =
      Array.from(payloadInputComboBox.querySelectorAll('div.fd-popover__body a'))
      .find((a : HTMLLinkElement) => a.textContent == input) as HTMLLinkElement;
    const payloadOutputMenuLink =
      Array.from(payloadOutputComboBox.querySelectorAll('div.fd-popover__body a'))
      .find((a : HTMLLinkElement) => a.textContent.trim() == output) as HTMLLinkElement;
    payloadOutputMenuLink.click();
    payloadInputMenuLink.click();
    await fixture.whenStable();
    fixture.detectChanges();
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
    const xssPromise = spyOnAndCallThroughAndPromise(window, 'xss');
    await select('Image onerror', 'Raw HTML');
    await Promise.race([xssPromise, timeout(1000)]);
    expect(alertOverlay.querySelector('.alert-xss-triggered')).not.toBeNull();
  });
});
