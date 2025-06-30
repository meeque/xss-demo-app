import { Component, ComponentRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import $ from 'jquery';

import { queryAndExpectOne, queryAndExpectOptional, whenStableDetectChanges } from '../test/lib.spec';

import { PayloadOutputDescriptor, PayloadOutputQuality } from './payload-output.service';
import { PayloadOutputComponent } from './payload-output.component';
import { LiveOutputComponent } from './live-output.component';
import { StripExtraIndentPipe } from '../lib/strip-extra-indent.pipe';


interface MockPayloadOutputDescriptor extends PayloadOutputDescriptor {
  calculateExpectedOutput(input: string): string;
}

@Component({
  selector: 'xss-mock-live-output-template',
  template: MockLiveOutputTemplateComponent.templateCode,
  standalone: true
})
class MockLiveOutputTemplateComponent extends LiveOutputComponent {
  static readonly templateCode = '<p [innerHTML]="payload"></p>';
}


describe('PayloadOutputComponent', () => {

  const stripExtraIndentPipe = new StripExtraIndentPipe();
  let domSanitizer : DomSanitizer;

  let fixture : ComponentFixture<PayloadOutputComponent>;
  let componentRef: ComponentRef<PayloadOutputComponent>;
  let component : PayloadOutputComponent;
  let element : HTMLElement;
  let changeCallbackSpy : jasmine.Spy;


  const mockDescriptors: Record<string, MockPayloadOutputDescriptor> = {
    /**
     * A payload output that removes all x characters.
     * Useful for testing update behavior where the input payload changes, but the output payload does not.
     */
    foo: {
      id: 'foo',
      name: 'Foo',
      title: 'Mock PayloadOutputDescriptor Foo',
      quality: PayloadOutputQuality.Insecure,
      payloadProcessor: function removeAllX(payload) {
        return payload.replaceAll('x', '').replaceAll('X', '');
      },
      htmlSourceProvider: function divContent(payload) {
        return '<div>' + payload + '</div>';
      },
      calculateExpectedOutput: input => `<div>${input.replaceAll('x', '').replaceAll('X', '')}</div>`
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
        element.innerText = '' + payload;
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
      templateComponentType: MockLiveOutputTemplateComponent,
      calculateExpectedOutput: input => `<p>${input}</p>`
    },

    qux: {
      id: 'qux',
      name: 'Qux',
      title: 'Mock <strong>PayloadOutputDescriptor</strong> Qux',
      quality: PayloadOutputQuality.Recommended,
      jQueryInjector: function paragraphTitle(element, payload) {
        $('<p>').attr('title', '' + payload).text('This is a paragraph.').appendTo(element);
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

    changeCallbackSpy = jasmine.createSpy('on change event', event => event);
    component.update.subscribe(changeCallbackSpy);
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
      expectComponentView(mockDescriptors.foo, '', 0);
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
          expectComponentView(mockDescriptor, '', null);

          await setPayload('plain text');
          expectComponentView(mockDescriptor, 'plain text');

          await setPayload('plain tet');
          expectComponentView(mockDescriptor, 'plain tet');

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
      queryAndExpectAutoUpdateToggle(true);
      queryAndExpectUpdateNowLink(false);

      await clickAndExpectAutoUpdateToggle(false);
      queryAndExpectUpdateNowLink(true);

      await clickAndExpectAutoUpdateToggle(true);
      queryAndExpectUpdateNowLink(false);
    });

    it('should always reflect output changes immediately', async () => {
      await setPayload('ye olde payload');
      expectComponentView(mockDescriptors.foo, 'ye olde payload');

      await clickAndExpectAutoUpdateToggle(false);
      expectComponentView(mockDescriptors.foo, 'ye olde payload', 0);

      await setDescriptor(mockDescriptors.bar);
      expectComponentView(mockDescriptors.bar, 'ye olde payload');

      await setDescriptor(mockDescriptors.qux);
      expectComponentView(mockDescriptors.qux, 'ye olde payload');

      await setDescriptor(mockDescriptors.foo);
      expectComponentView(mockDescriptors.foo, 'ye olde payload');
    });

    it('should reflect a mix of automatic changes of output and manual changes of payload', async () => {
      expectComponentView(mockDescriptors.foo, '', 0);

      await clickAndExpectAutoUpdateToggle(false);
      expectComponentView(mockDescriptors.foo, '', 0);

      await setPayload('f');
      expectComponentView(mockDescriptors.foo, '', 0);

      await setPayload('fo');
      expectComponentView(mockDescriptors.foo, '', 0);

      await setPayload('foo');
      expectComponentView(mockDescriptors.foo, '', 0);

      queryAndExpectUpdateNowLink(true).click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptors.foo, 'foo');

      await setPayload('foo bar');
      expectComponentView(mockDescriptors.foo, 'foo', 0);

      await setDescriptor(mockDescriptors.qux);
      expectComponentView(mockDescriptors.qux, 'foo bar');

      await setDescriptor(mockDescriptors.baz);
      expectComponentView(mockDescriptors.baz, 'foo bar');

      queryAndExpectUpdateNowLink(true).click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptors.baz, 'foo bar');

      await setPayload('And Now for Something Completely Different');
      expectComponentView(mockDescriptors.baz, 'foo bar', 0);

      queryAndExpectUpdateNowLink(true).click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptors.baz, 'And Now for Something Completely Different');

      await setPayload('Here be <img src="sdgt" onerror="console.log(\'xss\')">');
      expectComponentView(mockDescriptors.baz, 'And Now for Something Completely Different', 0);

      await setDescriptor(mockDescriptors.bar);
      expectComponentView(mockDescriptors.bar, 'Here be <img src="sdgt" onerror="console.log(\'xss\')">');

      await setPayload('We\'re done here! Let\'s go back to auto update...');
      expectComponentView(mockDescriptors.bar, 'Here be <img src="sdgt" onerror="console.log(\'xss\')">', 0);

      await clickAndExpectAutoUpdateToggle(true);
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptors.bar, 'We\'re done here! Let\'s go back to auto update...');
    });

    it('should reflect manual and automatic changes of input payload that do not change the output payload', async () => {
      await setPayload('zyx');
      expectComponentView(mockDescriptors.foo, 'zy');

      await clickAndExpectAutoUpdateToggle(false);
      expectComponentView(mockDescriptors.foo, 'zy', 0);

      await setPayload('zyxx');
      expectComponentView(mockDescriptors.foo, 'zy', 0);

      await setPayload('zyxxx');
      expectComponentView(mockDescriptors.foo, 'zy', 0);

      await clickAndExpectAutoUpdateToggle(true);
      expectComponentView(mockDescriptors.foo, 'zy');

      await setPayload('zyx');
      expectComponentView(mockDescriptors.foo, 'zy');

      await clickAndExpectAutoUpdateToggle(false);
      expectComponentView(mockDescriptors.foo, 'zy', 0);

      await setPayload('xyz');
      expectComponentView(mockDescriptors.foo, 'zy', 0);

      queryAndExpectUpdateNowLink(true).click();
      await whenStableDetectChanges(fixture);
      expectComponentView(mockDescriptors.foo, 'yz');

      await setPayload('xxxyz');
      expectComponentView(mockDescriptors.foo, 'yz', 0);

      await clickAndExpectAutoUpdateToggle(true);
      expectComponentView(mockDescriptors.foo, 'yz');
    });

    for (const mockDescriptor of Object.values(mockDescriptors)) {

      describe('with descriptor "' + mockDescriptor.id + '"', () => {

        it('should only reflect payload changes after manual update', async () => {
          await clickAndExpectAutoUpdateToggle(false);
          await setDescriptor(mockDescriptor);
          expectComponentView(mockDescriptor, '', null);

          await setPayload('let\'s enter some payload ...');
          expectComponentView(mockDescriptor, '', 0);

          await setPayload('let\'s enter some payload without updating the output');
          expectComponentView(mockDescriptor, '', 0);

          await setPayload('next, let\'s update the output manually');
          expectComponentView(mockDescriptor, '', 0);

          queryAndExpectUpdateNowLink(true).click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, 'next, let\'s update the output manually');

          await setPayload('now, let\'s change the payload again');
          expectComponentView(mockDescriptor, 'next, let\'s update the output manually', 0);

          queryAndExpectUpdateNowLink(true).click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, 'now, let\'s change the payload again');
        });

        it('should reload live output on manual update, even when payload has not changed', async () => {
          await clickAndExpectAutoUpdateToggle(false);
          await setDescriptor(mockDescriptor);
          expectComponentView(mockDescriptor, '', null);

          queryAndExpectUpdateNowLink(true).click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, '');

          await setPayload('foo');
          expectComponentView(mockDescriptor, '', 0);

          await setPayload('foo bar');
          expectComponentView(mockDescriptor, '', 0);

          queryAndExpectUpdateNowLink(true).click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, 'foo bar');

          queryAndExpectUpdateNowLink(true).click();
          await whenStableDetectChanges(fixture);
          expectComponentView(mockDescriptor, 'foo bar');

          await clickAndExpectAutoUpdateToggle(true);
          expectComponentView(mockDescriptor, 'foo bar');
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

  function expectComponentView(descriptor: MockPayloadOutputDescriptor, expectedOutput?: string, expectedChangeEvents=1) {
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

    if (expectedChangeEvents != null) {
      expect(changeCallbackSpy).toHaveBeenCalledTimes(expectedChangeEvents);
    }
    changeCallbackSpy.calls.reset();
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

  function queryAndExpectAutoUpdateToggle(expectedToggleState?: boolean) {
    const liveOutputPanel = queryAndExpectLiveOutput();
    const toggle = queryAndExpectOne(liveOutputPanel, '.fd-layout-panel__header .fd-layout-panel__actions label input[type=checkbox]') as HTMLInputElement;
    expect(toggle.type).toBe('checkbox');
    expect(toggle.checked).toBe(component.autoUpdate());
    if (expectedToggleState != null) {
      expect(toggle.checked).toBe(expectedToggleState);
    }
    return toggle;
  }

  async function clickAndExpectAutoUpdateToggle(expectedToggleState?: boolean) {
    queryAndExpectAutoUpdateToggle(expectedToggleState == null ? null : !expectedToggleState).click();
    await whenStableDetectChanges(fixture);
    return queryAndExpectAutoUpdateToggle(expectedToggleState);
  }

  function queryAndExpectUpdateNowLink(expectLinkToExist?: boolean) {
    const liveOutputPanel = queryAndExpectLiveOutput();
    const updateNowLink = queryAndExpectOptional(liveOutputPanel, '.fd-layout-panel__header .fd-layout-panel__actions span a');

    if (expectLinkToExist != null) {
      expect(!!updateNowLink).withContext('Update Now link exists').toBe(expectLinkToExist);
    }

    return updateNowLink;
  }

  function strip(text: unknown): string {
    return stripExtraIndentPipe.transform(text);
  }
});
