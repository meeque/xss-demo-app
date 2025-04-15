import { Component, ComponentRef, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { fn } from 'jquery';

import { queryAndExpectOne, queryAndExpectOptional, whenStableDetectChanges } from '../test/lib.spec';

import { PayloadOutputDescriptor, PayloadOutputQuality } from './payload-output.service';
import { PayloadOutputComponent } from './payload-output.component';
import { AngularLiveOutputComponent } from './live-output.component';
import { StripExtraIndentPipe } from '../lib/strip-extra-indent.pipe';


interface MockPayloadOutputDescriptor extends PayloadOutputDescriptor {
  outputCalculator(input: string): string;
}

interface MockPayloadOutputDescriptors {
  [id: string]: MockPayloadOutputDescriptor;
}

@Component({
  selector: 'mock-template-output',
  template: MockOutputComponent.templateCode,
  standalone: true
})
class MockOutputComponent extends AngularLiveOutputComponent {
  static templateCode = '<p [innerHTML]="payload"></p>';
}


describe('PayloadOutputComponent', () => {

  const stripExtraIndentPipe = new StripExtraIndentPipe();
  let domSanitizer : DomSanitizer;

  let fixture : ComponentFixture<PayloadOutputComponent>;
  let componentRef: ComponentRef<PayloadOutputComponent>;
  let component : PayloadOutputComponent;
  let element : HTMLElement;


  const mockDescriptors: MockPayloadOutputDescriptors = {
    foo: {
      id: 'foo',
      name: 'Foo',
      title: 'Mock PayloadOutputDescriptor Foo',
      quality: PayloadOutputQuality.Insecure,
      htmlSourceProvider: function divContent(payload) {
        return '<div>' + payload + '</div>';
      },
      outputCalculator: input => `<div>${input}</div>`
    },

    bar: {
      id: 'bar',
      name: 'Bar',
      title: 'Mock PayloadOutputDescriptor <em>Bar</em>',
      quality: PayloadOutputQuality.Recommended,
      payloadProcessor: function toUpperCase(payload) {
        return payload.toUpperCase();
      },
      domInjector: function innerText(element, payload) {
        element.innerText = payload;
      },
      outputCalculator: input => {
        return input
          .toUpperCase()
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;');
      }
    },

    baz: {
      id: 'baz',
      name: 'Baz',
      title: 'Mock PayloadOutputDescriptor Baz',
      quality: PayloadOutputQuality.Insecure,
      payloadProcessor: function trustHtml(payload) {
        return domSanitizer.bypassSecurityTrustHtml(payload);
      },
      templateComponentType: MockOutputComponent,
      outputCalculator: input => `<p>${input}</p>`
    },

    qux: {
      id: 'qux',
      name: 'Qux',
      title: 'Mock <strong>PayloadOutputDescriptor</strong> Qux',
      quality: PayloadOutputQuality.Recommended,
      jQueryInjector: function paragraphTitle(element, payload) {
        $('<p>').attr('title', payload).text('This is a paragraph.').appendTo(element);
      },
      outputCalculator: (input: string) => {
        return `<p title="${input.replaceAll('"', '&quot;')}">This is a paragraph.</p>`;
      }
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

    fixture.componentRef.setInput('outputDescriptor', mockDescriptors.foo);
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
      expectComponentView(mockDescriptors.foo, '<div></div>');
    });
  });

  describe('view with auto-update', () => {

    it('should reflect output changes', async () => {
      await setDescriptor(mockDescriptors.bar);
      expectComponentView(mockDescriptors.bar, '');

      await setDescriptor(mockDescriptors.baz);
      expectComponentView(mockDescriptors.baz, '<p></p>');

      await setDescriptor(mockDescriptors.foo);
      expectComponentView(mockDescriptors.foo, '<div></div>');

      await setDescriptor(mockDescriptors.qux);
      expectComponentView(mockDescriptors.qux, '<p title="">This is a paragraph.</p>');
    });

    it('should reflect a mix of output changes and payload changes', async () => {
      await setPayload('some text');
      expectComponentView(mockDescriptors.foo, '<div>some text</div>');

      await setDescriptor(mockDescriptors.bar);
      expectComponentView(mockDescriptors.bar, 'SOME TEXT');

      await setPayload('<img src="wteyk" onerror="console.log(\'xss\')">');
      expectComponentView(mockDescriptors.bar, '&lt;IMG SRC="WTEYK" ONERROR="CONSOLE.LOG(\'XSS\')"&gt;');

      await setDescriptor(mockDescriptors.qux);
      expectComponentView(mockDescriptors.qux, '<p title="<img src=&quot;wteyk&quot; onerror=&quot;console.log(\'xss\')&quot;>">This is a paragraph.</p>');

      await setDescriptor(mockDescriptors.baz);
      expectComponentView(mockDescriptors.baz, '<p><img src="wteyk" onerror="console.log(\'xss\')"></p>');

      await setPayload('more harmless text');
      expectComponentView(mockDescriptors.baz, '<p>more harmless text</p>');

      await setDescriptor(mockDescriptors.qux);
      expectComponentView(mockDescriptors.qux, '<p title="more harmless text">This is a paragraph.</p>');
    });

    for (const mockDescriptor of Object.values(mockDescriptors)) {

      describe('with descriptor "' + mockDescriptor.id + '"', () => {

        it('should reflect payload changes', async () => {
          await setDescriptor(mockDescriptor);

          await setPayload('plain text');
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator('plain text'));

          await setPayload('<img src="ufrvnrty" onerror="console.log(\'xss\')">');
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator('<img src="ufrvnrty" onerror="console.log(\'xss\')">'));

          await setPayload('');
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator(''));
        });

      });

    }

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
      expectComponentView(mockDescriptors.foo, '<div>ye olde payload</div>');

      queryAndExpectAutoUpdateToggle().click();
      await whenStableDetectChanges(fixture);
      expect(component.autoUpdate()).toBe(false);
      expectComponentView(mockDescriptors.foo, '<div>ye olde payload</div>');

      await setDescriptor(mockDescriptors.bar);
      expectComponentView(mockDescriptors.bar, 'YE OLDE PAYLOAD');

      await setDescriptor(mockDescriptors.qux);
      expectComponentView(mockDescriptors.qux, '<p title="ye olde payload">This is a paragraph.</p>');

      await setDescriptor(mockDescriptors.foo);
      expectComponentView(mockDescriptors.foo, '<div>ye olde payload</div>');
    });

    it('should reflect a mix of automatic changes of output and manual changes of payload', async () => {
      expectComponentView(mockDescriptors.foo, '<div></div>');

      queryAndExpectAutoUpdateToggle().click();
      await whenStableDetectChanges(fixture);
      expect(component.autoUpdate()).toBe(false);
      expectComponentView(mockDescriptors.foo, '<div></div>');

      await setPayload('f');
      expectComponentView(mockDescriptors.foo, '<div></div>');

      await setPayload('fo');
      expectComponentView(mockDescriptors.foo, '<div></div>');

      await setPayload('foo');
      expectComponentView(mockDescriptors.foo, '<div></div>');

      queryAndExpectUpdateNowLink(true).click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptors.foo, '<div>foo</div>');

      await setPayload('foo bar');
      expectComponentView(mockDescriptors.foo, '<div>foo</div>');

      await setDescriptor(mockDescriptors.qux);
      expectComponentView(mockDescriptors.qux, '<p title="foo bar">This is a paragraph.</p>');

      await setDescriptor(mockDescriptors.baz);
      expectComponentView(mockDescriptors.baz, '<p>foo bar</p>');

      queryAndExpectUpdateNowLink(true).click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptors.baz, '<p>foo bar</p>');

      await setPayload('And Now for Something Completely Different');
      expectComponentView(mockDescriptors.baz, '<p>foo bar</p>');

      queryAndExpectUpdateNowLink(true).click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptors.baz, '<p>And Now for Something Completely Different</p>');

      await setPayload('Here be <img src="sdgt" onerror="console.log(\'xss\')">');
      expectComponentView(mockDescriptors.baz, '<p>And Now for Something Completely Different</p>');

      await setDescriptor(mockDescriptors.bar);
      expectComponentView(mockDescriptors.bar, 'HERE BE &lt;IMG SRC="SDGT" ONERROR="CONSOLE.LOG(\'XSS\')"&gt;');

      await setPayload('We\'re done here! Let\'s go back to auto update...');
      expectComponentView(mockDescriptors.bar, 'HERE BE &lt;IMG SRC="SDGT" ONERROR="CONSOLE.LOG(\'XSS\')"&gt;');

      queryAndExpectAutoUpdateToggle().click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptors.bar, 'WE\'RE DONE HERE! LET\'S GO BACK TO AUTO UPDATE...');
    });

    for (const mockDescriptor of Object.values(mockDescriptors)) {

      describe('with descriptor "' + mockDescriptor.id + '"', () => {

        it('should only reflect payload changes after manual update', async () => {
          queryAndExpectAutoUpdateToggle().click();
          expect(component.autoUpdate()).toBe(false);
          await setDescriptor(mockDescriptor);
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator(''));

          await setPayload('let\'s enter some payload ...');
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator(''));

          await setPayload('let\'s enter some payload without updating the output');
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator(''));

          await setPayload('next, let\'s update the output manually');
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator(''));

          queryAndExpectUpdateNowLink(true).click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator('next, let\'s update the output manually'));

          await setPayload('now, let\'s change the payload again');
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator('next, let\'s update the output manually'));

          queryAndExpectUpdateNowLink(true).click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator('now, let\'s change the payload again'));
        });

        it('should reload live output on manual update, even when payload has not changed', async () => {
          queryAndExpectAutoUpdateToggle().click();
          expect(component.autoUpdate()).toBe(false);
          await setDescriptor(mockDescriptor);
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator(''));

          const reloadSpy = spyOn(component._liveOutputComponent.instance, 'reload').and.callThrough();

          queryAndExpectUpdateNowLink(true).click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator(''));
          expect(reloadSpy).toHaveBeenCalled();
          reloadSpy.calls.reset();

          await setPayload('foo');
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator(''));
          expect(reloadSpy).not.toHaveBeenCalled();

          await setPayload('foo bar');
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator(''));
          expect(reloadSpy).not.toHaveBeenCalled();

          queryAndExpectUpdateNowLink(true).click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator('foo bar'));
          expect(reloadSpy).not.toHaveBeenCalled();

          queryAndExpectUpdateNowLink(true).click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator('foo bar'));
          expect(reloadSpy).toHaveBeenCalled();
          reloadSpy.calls.reset();

          // TODO force a reload after auto update is turned on, even if not output payload changes
          /*
          queryAndExpectAutoUpdateToggle().click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, mockDescriptor.outputCalculator('foo bar'));
          expect(reloadSpy).toHaveBeenCalled();
          reloadSpy.calls.reset();
          */
        });

      });

    }

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
