import { ComponentRef } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { queryAndExpectOne, queryAndExpectOptional, whenStableDetectChanges } from '../test/lib.spec';

import { PayloadOutputDescriptor, PayloadOutputQuality } from './payload-output.service';
import { PayloadOutputComponent } from './payload-output.component';
import { StripExtraIndentPipe } from '../lib/strip-extra-indent.pipe';


describe('PayloadOutputComponent', () => {

  let fixture : ComponentFixture<PayloadOutputComponent>;
  let componentRef: ComponentRef<PayloadOutputComponent>;
  let component : PayloadOutputComponent;
  let element : HTMLElement;

  const stripExtraIndentPipe = new StripExtraIndentPipe();

  const mockDescriptorFoo: PayloadOutputDescriptor = {
    id: 'foo',
    name: 'Foo',
    title: 'Mock PayloadOutputDescriptor Foo',
    quality: PayloadOutputQuality.Insecure,
    htmlSourceProvider: function divContent(payload) {
      return '<div>' + payload + '</div>';
    }
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [PayloadOutputComponent]
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(PayloadOutputComponent);

    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    fixture.componentRef.setInput('outputDescriptor', mockDescriptorFoo);
    fixture.detectChanges();
    await whenStableDetectChanges(fixture);
  });

  it('should be created', () => {
    expect(component).toBeDefined();
  });

  describe('initially', () => {

    it('should have empty payload', () => {
      expect(component.payload()).toBe('');
    });

    describeComponentUI(mockDescriptorFoo, '<template-output-non-angular><div></div></template-output-non-angular><!--container-->', '<div></div>');
  });

  function describeComponentUI(descriptor: PayloadOutputDescriptor, liveOutput?: string, liveSourceCode?: string) {

    it(`should have title "${descriptor.title}"`, () => {
      queryAndExpectTitle(descriptor);
    });

    it(
      descriptor.payloadProcessor
        ? `should have a Payload Processor Function panel with function "${descriptor.payloadProcessor.name}()"`
        : 'should have NO Payload Processor Function panel',
      () => {
        queryAndExpectPayloadProcessor(descriptor);
      }
    );

    it(
      descriptor.htmlSourceProvider
        ? `should have a HTML Source Provider Function panel with function "${descriptor.htmlSourceProvider.name}()"`
        : 'should have NO HTML Source Provider Function panel',
      () => {
        queryAndExpectHtmlSourceProvider(descriptor);
      }
    );

    it(
      descriptor.domInjector
        ? `should have a DOM Injector Function panel with function "${descriptor.domInjector.name}()"`
        : 'should have NO DOM Injector Function panel',
      () => {
        queryAndExpectDomInjector(descriptor);
      }
    );

    it(
      descriptor.jQueryInjector
        ? `should have a jQuery Injector Function panel with function "${descriptor.jQueryInjector.name}()"`
        : 'should have NO jQuery Injector Function panel',
      () => {
        queryAndExpectJQueryInjector(descriptor);
      }
    );

    it(
      descriptor.templateComponentType
        ? `should have a Angular Template Code panel`
        : 'should have NO Angular Template Code panel',
      () => {
        queryAndExpectTemplateComponentType(descriptor);
      }
    );

    it(
      liveOutput != null
        ? `should have a Live HTML Output panel with output "${liveOutput}"`
        : 'should have a Live HTML Output panel',
      () => {
        queryAndExpectLiveOutput(liveOutput);
      }
    );

    it(
      liveSourceCode != null
        ? `should have a Live Source Code panel with output "${liveSourceCode}"`
        : 'should have a Live Source Code panel',
      () => {
        queryAndExpectLiveSourceCode(liveSourceCode);
      }
    );
  }

  function queryAndExpectTitle(descriptor: PayloadOutputDescriptor) {
    const title = queryAndExpectOne(element, 'div.title.fd-layout-panel h3');
    expect(title.textContent.trim()).toBe(descriptor.title);
    return title;
  }

  function queryAndExpectPayloadProcessor(descriptor: PayloadOutputDescriptor) {
    const panel = queryAndExpectOptional(element, 'div.paylaod-processor.fd-layout-panel');

    if (descriptor.payloadProcessor === undefined) {
      expect(panel).withContext('Payload Processor panel for PauloadOutputDescripter without a paylaodProcessor').toBeNull();
      return null;
    }

    expect(panel).withContext('Payload Processor panel for PauloadOutputDescripter with a paylaodProcessor').not.toBeNull();
    const title = queryAndExpectOne(panel, 'h4.fd-layout-panel__title');
    expect(title.textContent.trim()).toBe('Payload Processor Function');
    const body = queryAndExpectOne(panel, 'div.fd-layout-panel__body');
    expect(body.textContent.trim()).toBe(descriptor.payloadProcessor.toString());
    return body;
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
    expect(body.textContent.trim()).toBe(strip(descriptor.htmlSourceProvider));
    return body;
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
    expect(body.textContent.trim()).toBe(strip(descriptor.domInjector));
    return body;
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
    expect(body.textContent.trim()).toBe(strip(descriptor.jQueryInjector));
    return body;
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
    expect(body.textContent.trim()).toBe(strip(descriptor.templateComponentType.templateCode));
    return body;
  }

  function queryAndExpectLiveOutput(expectedOutput?: string) {
    const panel = queryAndExpectOne(element, 'div.live-output.fd-layout-panel');
    const title = queryAndExpectOne(panel, 'h4.fd-layout-panel__title');
    expect(title.textContent.trim()).toBe('Live HTML Output');
    const body = queryAndExpectOne(panel, 'div.fd-layout-panel__body');
    if (expectedOutput != null) {
      expect(body.innerHTML.trim()).toBe(expectedOutput);
    }
    return body;
  }

  function queryAndExpectLiveSourceCode(expectedSourceCode?: string) {
    const panel = queryAndExpectOne(element, 'div.live-source-code.fd-layout-panel');
    const title = queryAndExpectOne(panel, 'h4.fd-layout-panel__title');
    expect(title.textContent.trim()).toBe('Live HTML Source Code');
    const body = queryAndExpectOne(panel, 'div.fd-layout-panel__body');
    if (expectedSourceCode != null) {
      expect(body.textContent.trim()).toBe(expectedSourceCode);
    }
    return body;
  }

  function strip(text: any): string {
    return stripExtraIndentPipe.transform(text);
  }
});
