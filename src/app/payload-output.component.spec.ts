import { Component, ComponentRef, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { fn } from 'jquery';

import { queryAndExpectOne, queryAndExpectOptional, whenStableDetectChanges } from '../test/lib.spec';

import { PayloadOutputDescriptor, PayloadOutputQuality } from './payload-output.service';
import { PayloadOutputComponent } from './payload-output.component';
import { LiveOutputComponent } from './live-output.component';
import { StripExtraIndentPipe } from '../lib/strip-extra-indent.pipe';


interface MockPayloadOutputDescriptor extends PayloadOutputDescriptor {
  calculateExpectedOutput(input: string): string;
}

interface MockPayloadOutputDescriptors {
  [id: string]: MockPayloadOutputDescriptor;
}

@Component({
  selector: 'mock-template-output',
  template: MockOutputComponent.templateCode,
  standalone: true
})
class MockOutputComponent extends LiveOutputComponent {
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
      calculateExpectedOutput: input => `<div>${input}</div>`
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
      calculateExpectedOutput: input => {
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
      calculateExpectedOutput: input => `<p>${input}</p>`
    },

    qux: {
      id: 'qux',
      name: 'Qux',
      title: 'Mock <strong>PayloadOutputDescriptor</strong> Qux',
      quality: PayloadOutputQuality.Recommended,
      jQueryInjector: function paragraphTitle(element, payload) {
        $('<p>').attr('title', payload).text('This is a paragraph.').appendTo(element);
      },
      calculateExpectedOutput: (input: string) => {
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
      expectComponentView(mockDescriptors.foo, '');
    });
  });

  describe('view with auto-update', () => {

    it('should reflect output changes', async () => {
      await setDescriptor(mockDescriptors.bar);
      expectComponentView(mockDescriptors.bar, '');

      await setDescriptor(mockDescriptors.baz);
      expectComponentView(mockDescriptors.baz, '');

      await setDescriptor(mockDescriptors.foo);
      expectComponentView(mockDescriptors.foo, '');

      await setDescriptor(mockDescriptors.qux);
      expectComponentView(mockDescriptors.qux, '');
    });

    it('should reflect a mix of output changes and payload changes', async () => {
      await setPayload('some text');
      expectComponentView(mockDescriptors.foo, 'some text');

      await setDescriptor(mockDescriptors.bar);
      expectComponentView(mockDescriptors.bar, 'some text');

      await setPayload('<img src="wteyk" onerror="console.log(\'xss\')">');
      expectComponentView(mockDescriptors.bar, '<img src="wteyk" onerror="console.log(\'xss\')">');

      await setDescriptor(mockDescriptors.qux);
      expectComponentView(mockDescriptors.qux, '<img src="wteyk" onerror="console.log(\'xss\')">');

      await setDescriptor(mockDescriptors.baz);
      expectComponentView(mockDescriptors.baz, '<img src="wteyk" onerror="console.log(\'xss\')">');

      await setPayload('more harmless text');
      expectComponentView(mockDescriptors.baz, 'more harmless text');

      await setDescriptor(mockDescriptors.qux);
      expectComponentView(mockDescriptors.qux, 'more harmless text');
    });

    for (const mockDescriptor of Object.values(mockDescriptors)) {

      describe('with descriptor "' + mockDescriptor.id + '"', () => {

        it('should reflect payload changes', async () => {
          await setDescriptor(mockDescriptor);

          await setPayload('plain text');
          expectComponentView(mockDescriptor, 'plain text');

          await setPayload('<img src="ufrvnrty" onerror="console.log(\'xss\')">');
          expectComponentView(mockDescriptor, '<img src="ufrvnrty" onerror="console.log(\'xss\')">');

          await setPayload('');
          expectComponentView(mockDescriptor, '');
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
      expectComponentView(mockDescriptors.foo, 'ye olde payload');

      queryAndExpectAutoUpdateToggle().click();
      await whenStableDetectChanges(fixture);
      expect(component.autoUpdate()).toBe(false);
      expectComponentView(mockDescriptors.foo, 'ye olde payload');

      await setDescriptor(mockDescriptors.bar);
      expectComponentView(mockDescriptors.bar, 'ye olde payload');

      await setDescriptor(mockDescriptors.qux);
      expectComponentView(mockDescriptors.qux, 'ye olde payload');

      await setDescriptor(mockDescriptors.foo);
      expectComponentView(mockDescriptors.foo, 'ye olde payload');
    });

    it('should reflect a mix of automatic changes of output and manual changes of payload', async () => {
      expectComponentView(mockDescriptors.foo, '');

      queryAndExpectAutoUpdateToggle().click();
      await whenStableDetectChanges(fixture);
      expect(component.autoUpdate()).toBe(false);
      expectComponentView(mockDescriptors.foo, '');

      await setPayload('f');
      expectComponentView(mockDescriptors.foo, '');

      await setPayload('fo');
      expectComponentView(mockDescriptors.foo, '');

      await setPayload('foo');
      expectComponentView(mockDescriptors.foo, '');

      queryAndExpectUpdateNowLink(true).click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptors.foo, 'foo');

      await setPayload('foo bar');
      expectComponentView(mockDescriptors.foo, 'foo');

      await setDescriptor(mockDescriptors.qux);
      expectComponentView(mockDescriptors.qux, 'foo bar');

      await setDescriptor(mockDescriptors.baz);
      expectComponentView(mockDescriptors.baz, 'foo bar');

      queryAndExpectUpdateNowLink(true).click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptors.baz, 'foo bar');

      await setPayload('And Now for Something Completely Different');
      expectComponentView(mockDescriptors.baz, 'foo bar');

      queryAndExpectUpdateNowLink(true).click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptors.baz, 'And Now for Something Completely Different');

      await setPayload('Here be <img src="sdgt" onerror="console.log(\'xss\')">');
      expectComponentView(mockDescriptors.baz, 'And Now for Something Completely Different');

      await setDescriptor(mockDescriptors.bar);
      expectComponentView(mockDescriptors.bar, 'Here be <img src="sdgt" onerror="console.log(\'xss\')">');

      await setPayload('We\'re done here! Let\'s go back to auto update...');
      expectComponentView(mockDescriptors.bar, 'Here be <img src="sdgt" onerror="console.log(\'xss\')">');

      queryAndExpectAutoUpdateToggle().click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptors.bar, 'We\'re done here! Let\'s go back to auto update...');
    });

    for (const mockDescriptor of Object.values(mockDescriptors)) {

      describe('with descriptor "' + mockDescriptor.id + '"', () => {

        it('should only reflect payload changes after manual update', async () => {
          queryAndExpectAutoUpdateToggle().click();
          expect(component.autoUpdate()).toBe(false);
          await setDescriptor(mockDescriptor);
          expectComponentView(mockDescriptor, '');

          await setPayload('let\'s enter some payload ...');
          expectComponentView(mockDescriptor, '');

          await setPayload('let\'s enter some payload without updating the output');
          expectComponentView(mockDescriptor, '');

          await setPayload('next, let\'s update the output manually');
          expectComponentView(mockDescriptor, '');

          queryAndExpectUpdateNowLink(true).click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, 'next, let\'s update the output manually');

          await setPayload('now, let\'s change the payload again');
          expectComponentView(mockDescriptor, 'next, let\'s update the output manually');

          queryAndExpectUpdateNowLink(true).click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, 'now, let\'s change the payload again');
        });

        it('should reload live output on manual update, even when payload has not changed', async () => {
          queryAndExpectAutoUpdateToggle().click();
          expect(component.autoUpdate()).toBe(false);
          await setDescriptor(mockDescriptor);
          expectComponentView(mockDescriptor, '');

          const reloadSpy = spyOn(component._liveOutputComponent.instance, 'reload').and.callThrough();

          queryAndExpectUpdateNowLink(true).click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, '');
          expect(reloadSpy).toHaveBeenCalled();
          reloadSpy.calls.reset();

          await setPayload('foo');
          expectComponentView(mockDescriptor, '');
          expect(reloadSpy).not.toHaveBeenCalled();

          await setPayload('foo bar');
          expectComponentView(mockDescriptor, '');
          expect(reloadSpy).not.toHaveBeenCalled();

          queryAndExpectUpdateNowLink(true).click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, 'foo bar');
          expect(reloadSpy).not.toHaveBeenCalled();

          queryAndExpectUpdateNowLink(true).click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, 'foo bar');
          expect(reloadSpy).toHaveBeenCalled();
          reloadSpy.calls.reset();

          queryAndExpectAutoUpdateToggle().click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, 'foo bar');
          expect(reloadSpy).toHaveBeenCalled();
          reloadSpy.calls.reset();
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

  function expectComponentView(descriptor: MockPayloadOutputDescriptor, expectedOutput?: string) {

    let expectedOutputString = null;
    if (expectedOutput != null) {
      if (descriptor.calculateExpectedOutput(expectedOutput)) {
        expectedOutputString = descriptor.calculateExpectedOutput(expectedOutput);
      }
      else {
        expectedOutputString = expectedOutput
      }
    }

    queryAndExpectTitle(descriptor);
    queryAndExpectPayloadProcessor(descriptor);
    queryAndExpectHtmlSourceProvider(descriptor);
    queryAndExpectDomInjector(descriptor);
    queryAndExpectJQueryInjector(descriptor);
    queryAndExpectTemplateComponentType(descriptor);
    queryAndExpectLiveOutput(expectedOutputString);
    queryAndExpectLiveSourceCode(expectedOutputString);
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
