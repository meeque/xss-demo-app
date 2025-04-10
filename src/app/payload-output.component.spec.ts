import { Component, ComponentRef, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { fn } from 'jquery';

import { queryAndExpectOne, queryAndExpectOptional, whenStableDetectChanges } from '../test/lib.spec';

import { PayloadOutputDescriptor, PayloadOutputQuality } from './payload-output.service';
import { PayloadOutputComponent } from './payload-output.component';
import { LiveOutput } from './live-output.component';
import { StripExtraIndentPipe } from '../lib/strip-extra-indent.pipe';


@Component({
  selector: 'mock-template-output',
  template: MockOutputComponent.templateCode,
  standalone: true
})
class MockOutputComponent implements LiveOutput {
  static templateCode = '<p [innerHTML]="payload"></p>';

  outputDescriptor = input<PayloadOutputDescriptor>();
  outputPayload = input<any>();

  get payload() {
    return this.outputPayload();
  };
}


describe('PayloadOutputComponent', () => {

  const stripExtraIndentPipe = new StripExtraIndentPipe();
  let domSanitizer : DomSanitizer;

  let fixture : ComponentFixture<PayloadOutputComponent>;
  let componentRef: ComponentRef<PayloadOutputComponent>;
  let component : PayloadOutputComponent;
  let element : HTMLElement;

  const mockDescriptorFoo: PayloadOutputDescriptor = {
    id: 'foo',
    name: 'Foo',
    title: 'Mock PayloadOutputDescriptor Foo',
    quality: PayloadOutputQuality.Insecure,
    htmlSourceProvider: function divContent(payload) {
      return '<div>' + payload + '</div>';
    }
  }

  const mockDescriptorBar: PayloadOutputDescriptor = {
    id: 'bar',
    name: 'Bar',
    title: 'Mock PayloadOutputDescriptor <em>Bar</em>',
    quality: PayloadOutputQuality.Recommended,
    payloadProcessor: function toUpperCase(payload) {
      return payload.toUpperCase();
    },
    domInjector: function innerText(element, payload) {
      element.innerText = payload;
    }
  }

  const mockDescriptorBaz: PayloadOutputDescriptor = {
    id: 'baz',
    name: 'Baz',
    title: 'Mock PayloadOutputDescriptor Baz',
    quality: PayloadOutputQuality.Insecure,
    payloadProcessor: function trustHtml(payload) {
      return domSanitizer.bypassSecurityTrustHtml(payload);
    },
    templateComponentType: MockOutputComponent
  }

  const mockDescriptorQux: PayloadOutputDescriptor = {
    id: 'qux',
    name: 'Qux',
    title: 'Mock <strong>PayloadOutputDescriptor</strong> Qux',
    quality: PayloadOutputQuality.Recommended,
    jQueryInjector: function paragraphTitle(element, payload) {
      $('<p>').attr('title', payload).text('This is a paragraph.').appendTo(element);
    }
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [PayloadOutputComponent]
    });
    await TestBed.compileComponents();

    domSanitizer = TestBed.inject(DomSanitizer);

    fixture = TestBed.createComponent(PayloadOutputComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    fixture.componentRef.setInput('outputDescriptor', mockDescriptorFoo);
    fixture.autoDetectChanges();
    await whenStableDetectChanges(fixture);
  });

  describe('initially', () => {

    it('should be created', () => {
      expect(component).toBeDefined();
    });

    it('should have empty payload', () => {
      expect(component.payload()).toBe('');
    });

    it('should have auto-update enabled', () => {
      expect(component.autoUpdate()).toBeTrue();
    });

    it('should have a view with empty payload', () => {
      expectComponentView(mockDescriptorFoo, '<div></div>');
    });
  });

  describe('view with auto-update', () => {

    it('should reflect output changes', async () => {
      await setDescriptor(mockDescriptorBar);
      expectComponentView(mockDescriptorBar, '');

      await setDescriptor(mockDescriptorBaz);
      expectComponentView(mockDescriptorBaz, '<p></p>');

      await setDescriptor(mockDescriptorFoo);
      expectComponentView(mockDescriptorFoo, '<div></div>');

      await setDescriptor(mockDescriptorQux);
      expectComponentView(mockDescriptorQux, '<p title="">This is a paragraph.</p>');
    });

    it('should reflect payload changes', async () => {
      await setPayload('plain text');
      expectComponentView(mockDescriptorFoo, '<div>plain text</div>');

      await setPayload('<img src="ufrvnrty" onerror="console.log(\'xss\')">');
      expectComponentView(mockDescriptorFoo, '<div><img src="ufrvnrty" onerror="console.log(\'xss\')"></div>');

      await setPayload('');
      expectComponentView(mockDescriptorFoo, '<div></div>');
    });

    it('should reflect a mix of output changes and payload changes', async () => {
      await setPayload('some text');
      expectComponentView(mockDescriptorFoo, '<div>some text</div>');

      await setDescriptor(mockDescriptorBar);
      expectComponentView(mockDescriptorBar, 'SOME TEXT');

      await setPayload('<img src="wteyk" onerror="console.log(\'xss\')">');
      expectComponentView(mockDescriptorBar, '&lt;IMG SRC="WTEYK" ONERROR="CONSOLE.LOG(\'XSS\')"&gt;');

      await setDescriptor(mockDescriptorQux);
      expectComponentView(mockDescriptorQux, '<p title="<img src=&quot;wteyk&quot; onerror=&quot;console.log(\'xss\')&quot;>">This is a paragraph.</p>');

      await setDescriptor(mockDescriptorBaz);
      expectComponentView(mockDescriptorBaz, '<p><img src="wteyk" onerror="console.log(\'xss\')"></p>');

      await setPayload('more harmless text');
      expectComponentView(mockDescriptorBaz, '<p>more harmless text</p>');

      await setDescriptor(mockDescriptorQux);
      expectComponentView(mockDescriptorQux, '<p title="more harmless text">This is a paragraph.</p>');
    });
  });

  describe('view with manual update', () => {

    it('should toggle auto-update', async () => {
      const autoUpdateToggle = queryAndExpectAutoUpdateToggle();

      autoUpdateToggle.click();
      expect(component.autoUpdate()).toBe(false);
      queryAndExpectUpdateNowLink(true);

      autoUpdateToggle.click();
      expect(component.autoUpdate()).toBe(true);
      queryAndExpectUpdateNowLink(false);
    });

    it('should always reflect output changes immediately', async () => {
      await setPayload('ye olde payload');
      expectComponentView(mockDescriptorFoo, '<div>ye olde payload</div>');

      queryAndExpectAutoUpdateToggle().click();
      await whenStableDetectChanges(fixture);
      expect(component.autoUpdate()).toBe(false);
      expectComponentView(mockDescriptorFoo, '<div>ye olde payload</div>');

      await setDescriptor(mockDescriptorBar);
      expectComponentView(mockDescriptorBar, 'YE OLDE PAYLOAD');

      await setDescriptor(mockDescriptorQux);
      expectComponentView(mockDescriptorQux, '<p title="ye olde payload">This is a paragraph.</p>');

      await setDescriptor(mockDescriptorFoo);
      expectComponentView(mockDescriptorFoo, '<div>ye olde payload</div>');
    });

    it('should only reflect payload changes after manual update', async () => {
      queryAndExpectAutoUpdateToggle().click();
      expect(component.autoUpdate()).toBe(false);
      expectComponentView(mockDescriptorFoo, '<div></div>');

      await setPayload('let\'s enter some payload ...');
      expectComponentView(mockDescriptorFoo, '<div></div>');

      await setPayload('let\'s enter some payload without updating the output');
      expectComponentView(mockDescriptorFoo, '<div></div>');

      await setPayload('next, let\'s update the output manually');
      expectComponentView(mockDescriptorFoo, '<div></div>');

      queryAndExpectUpdateNowLink(true).click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptorFoo, '<div>next, let\'s update the output manually</div>');

      await setPayload('now, let\'s change the payload again');
      expectComponentView(mockDescriptorFoo, '<div>next, let\'s update the output manually</div>');

      queryAndExpectUpdateNowLink(true).click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptorFoo, '<div>now, let\'s change the payload again</div>');
    });

    it('should reflect a mix of automatic changes of output and manual changes of payload', async () => {
      expectComponentView(mockDescriptorFoo, '<div></div>');

      queryAndExpectAutoUpdateToggle().click();
      await whenStableDetectChanges(fixture);
      expect(component.autoUpdate()).toBe(false);
      expectComponentView(mockDescriptorFoo, '<div></div>');

      await setPayload('f');
      expectComponentView(mockDescriptorFoo, '<div></div>');

      await setPayload('fo');
      expectComponentView(mockDescriptorFoo, '<div></div>');

      await setPayload('foo');
      expectComponentView(mockDescriptorFoo, '<div></div>');

      queryAndExpectUpdateNowLink(true).click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptorFoo, '<div>foo</div>');

      await setPayload('foo bar');
      expectComponentView(mockDescriptorFoo, '<div>foo</div>');

      await setDescriptor(mockDescriptorQux);
      expectComponentView(mockDescriptorQux, '<p title="foo bar">This is a paragraph.</p>');

      await setDescriptor(mockDescriptorBaz);
      expectComponentView(mockDescriptorBaz, '<p>foo bar</p>');

      queryAndExpectUpdateNowLink(true).click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptorBaz, '<p>foo bar</p>');

      await setPayload('And Now for Something Completely Different');
      expectComponentView(mockDescriptorBaz, '<p>foo bar</p>');

      queryAndExpectUpdateNowLink(true).click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptorBaz, '<p>And Now for Something Completely Different</p>');

      await setPayload('Here be <img src="sdgt" onerror="console.log(\'xss\')">');
      expectComponentView(mockDescriptorBaz, '<p>And Now for Something Completely Different</p>');

      await setDescriptor(mockDescriptorBar);
      expectComponentView(mockDescriptorBar, 'HERE BE &lt;IMG SRC="SDGT" ONERROR="CONSOLE.LOG(\'XSS\')"&gt;');

      await setPayload('We\'re done here! Let\'s go back to auto update...');
      expectComponentView(mockDescriptorBar, 'HERE BE &lt;IMG SRC="SDGT" ONERROR="CONSOLE.LOG(\'XSS\')"&gt;');

      queryAndExpectAutoUpdateToggle().click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptorBar, 'WE\'RE DONE HERE! LET\'S GO BACK TO AUTO UPDATE...');
    });
  });

  async function setDescriptor(descriptor: PayloadOutputDescriptor): Promise<void> {
    componentRef.setInput('outputDescriptor', descriptor);
    await whenStableDetectChanges(fixture);
  }

  async function setPayload(payload: string): Promise<void> {
    componentRef.setInput('payload', payload);
    await whenStableDetectChanges(fixture);
  }

  function expectComponentView(descriptor: PayloadOutputDescriptor, expectedOutputCode?: string) {
    queryAndExpectTitle(descriptor);
    queryAndExpectPayloadProcessor(descriptor);
    queryAndExpectHtmlSourceProvider(descriptor);
    queryAndExpectDomInjector(descriptor);
    queryAndExpectJQueryInjector(descriptor);
    queryAndExpectTemplateComponentType(descriptor);
    queryAndExpectLiveOutput(expectedOutputCode);
    queryAndExpectLiveSourceCode(expectedOutputCode);
  }

  function queryAndExpectTitle(descriptor: PayloadOutputDescriptor) {
    const title = queryAndExpectOne(element, 'div.title.fd-layout-panel h3');
    expect(title.textContent.trim()).toBe(descriptor.title);
    return title;
  }

  function queryAndExpectPayloadProcessor(descriptor: PayloadOutputDescriptor) {
    const panel = queryAndExpectOptional(element, 'div.payload-processor.fd-layout-panel');

    if (descriptor.payloadProcessor === undefined) {
      expect(panel).withContext('Payload Processor panel for PayloadOutputDescripter without a payloadProcessor').toBeNull();
      return null;
    }

    expect(panel).withContext('Payload Processor panel for PayloadOutputDescripter with a payloadProcessor').not.toBeNull();
    const title = queryAndExpectOne(panel, 'h4.fd-layout-panel__title');
    expect(title.textContent.trim()).toBe('Payload Processor Function');
    const body = queryAndExpectOne(panel, 'div.fd-layout-panel__body');
    expect(body.textContent.trim()).withContext('Payload Processor Function').toBe(strip(descriptor.payloadProcessor.toString()));
    return panel;
  }

  function queryAndExpectHtmlSourceProvider(descriptor: PayloadOutputDescriptor) {
    const panel = queryAndExpectOptional(element, 'div.html-source-provider.fd-layout-panel');

    if (descriptor.htmlSourceProvider === undefined) {
      expect(panel).withContext('HTML Source Provider panel for PauloadOutputDescripter without a htmlSourceProvider').toBeNull();
      return null;
    }

    expect(panel).withContext('HTML Source Provider panel for PauloadOutputDescripter with a htmlSourceProvider').not.toBeNull();
    const title = queryAndExpectOne(panel, 'h4.fd-layout-panel__title');
    expect(title.textContent.trim()).toBe('HTML Source Provider Function');
    const body = queryAndExpectOne(panel, 'div.fd-layout-panel__body');
    expect(body.textContent.trim()).withContext('HTML Source Provider Function').toBe(strip(descriptor.htmlSourceProvider));
    return panel;
  }

  function queryAndExpectDomInjector(descriptor: PayloadOutputDescriptor) {
    const panel = queryAndExpectOptional(element, 'div.dom-injector.fd-layout-panel');

    if (descriptor.domInjector === undefined) {
      expect(panel).withContext('DOM Injector panel for PauloadOutputDescripter without a domInjector').toBeNull();
      return null;
    }

    expect(panel).withContext('DOM Injector panel for PauloadOutputDescripter with a domInjector').not.toBeNull();
    const title = queryAndExpectOne(panel, 'h4.fd-layout-panel__title');
    expect(title.textContent.trim()).toBe('DOM Injector Function');
    const body = queryAndExpectOne(panel, 'div.fd-layout-panel__body');
    expect(body.textContent.trim()).withContext('DOM Injector Function').toBe(strip(descriptor.domInjector));
    return panel;
  }

  function queryAndExpectJQueryInjector(descriptor: PayloadOutputDescriptor) {
    const panel = queryAndExpectOptional(element, 'div.jquery-injector.fd-layout-panel');

    if (descriptor.jQueryInjector === undefined) {
      expect(panel).withContext('jQuery Injector panel for PauloadOutputDescripter without a jQueryInjector').toBeNull();
      return null;
    }

    expect(panel).withContext('jQuery Injector panel for PauloadOutputDescripter with a jQueryInjector').not.toBeNull();
    const title = queryAndExpectOne(panel, 'h4.fd-layout-panel__title');
    expect(title.textContent.trim()).toBe('jQuery Injector Function');
    const body = queryAndExpectOne(panel, 'div.fd-layout-panel__body');
    expect(body.textContent.trim()).withContext('jQuery Injector Function').toBe(strip(descriptor.jQueryInjector));
    return panel;
  }

  function queryAndExpectTemplateComponentType(descriptor: PayloadOutputDescriptor) {
    const panel = queryAndExpectOptional(element, 'div.template-code.fd-layout-panel');

    if (descriptor.templateComponentType === undefined) {
      expect(panel).withContext('Angular Template panel for PauloadOutputDescripter without a templateComponentType').toBeNull();
      return null;
    }

    expect(panel).withContext('Angular Template panel for PauloadOutputDescripter with a templateComponentType').not.toBeNull();
    const title = queryAndExpectOne(panel, 'h4.fd-layout-panel__title');
    expect(title.textContent.trim()).toBe('Angular Template Code');
    const body = queryAndExpectOne(panel, 'div.fd-layout-panel__body');
    expect(body.textContent.trim()).withContext('Angular Template Code').toBe(strip(descriptor.templateComponentType.templateCode));
    return panel;
  }

  function queryAndExpectLiveOutput(expectedCode?: string) {
    const panel = queryAndExpectOne(element, 'div.live-output.fd-layout-panel');
    const title = queryAndExpectOne(panel, 'h4.fd-layout-panel__title');
    expect(title.textContent.trim()).toBe('Live HTML Output');
    const body = queryAndExpectOne(panel, 'div.fd-layout-panel__body');
    if (expectedCode != null) {
      const outputContainer = queryAndExpectOne(body, ':scope > *');
      expect(outputContainer.innerHTML.trim()).withContext('Live HTML Output').toBe(expectedCode);
    }
    return panel;
  }

  function queryAndExpectLiveSourceCode(expectedCode?: string) {
    const panel = queryAndExpectOne(element, 'div.live-source-code.fd-layout-panel');
    const title = queryAndExpectOne(panel, 'h4.fd-layout-panel__title');
    expect(title.textContent.trim()).toBe('Live HTML Source Code');
    const body = queryAndExpectOne(panel, 'div.fd-layout-panel__body');
    if (expectedCode != null) {
      expect(body.textContent.trim()).withContext('Live HTML Source Code').toBe(expectedCode);
    }
    return panel;
  }

  function queryAndExpectAutoUpdateToggle() {
    const liveOutputPanel = queryAndExpectLiveOutput();
    return queryAndExpectOne(liveOutputPanel, '.fd-layout-panel__header .fd-layout-panel__actions label input[type=checkbox]');
  }

  function queryAndExpectUpdateNowLink(expectItToExist?: boolean) {
    const liveOutputPanel = queryAndExpectLiveOutput();
    const updateNowLink = queryAndExpectOptional(liveOutputPanel, '.fd-layout-panel__header .fd-layout-panel__actions span a');

    if (expectItToExist !== undefined) {
      expect(!!updateNowLink).withContext('Update Now link exists').toBe(expectItToExist);
    }

    return updateNowLink;
  }

  function strip(text: any): string {
    return stripExtraIndentPipe.transform(text);
  }
});
