import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Popover } from 'bootstrap';
import { BsPopoverDirective } from './bs-popover.directive';

@Component({
  template: '<span data-bs-toggle="popover" data-bs-content="Test">Help</span>',
  imports: [BsPopoverDirective],
  standalone: true,
})
class TestHostComponent {}

describe('BsPopoverDirective', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
    await TestBed.compileComponents();
  });

  it('should initialize a Bootstrap Popover on the host element', () => {
    const getOrCreateInstance = jest.spyOn(Popover, 'getOrCreateInstance');
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-bs-toggle="popover"]');
    expect(getOrCreateInstance).toHaveBeenCalledWith(el);
  });

  it('should stop propagation on click and keydown events', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('[data-bs-toggle="popover"]');

    for (const type of ['click', 'keydown'] as const) {
      const event = new Event(type, { bubbles: true });
      jest.spyOn(event, 'stopPropagation');
      el.dispatchEvent(event);
      expect(event.stopPropagation).toHaveBeenCalled();
    }
  });

  it('should sync content when a data-bs-* attribute changes', async () => {
    const setContent = jest.spyOn(Popover.prototype, 'setContent');
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('[data-bs-toggle="popover"]');

    el.setAttribute('data-bs-content', 'Updated content');
    await new Promise(resolve => setTimeout(resolve));
    expect(setContent).toHaveBeenCalled();
  });

  // Bootstrap mutates aria-describedby on the trigger when it shows the popover,
  // and setContent() re-mutates it — without an attribute filter, this loops forever.
  it('should not sync when an unrelated attribute changes', async () => {
    const setContent = jest.spyOn(Popover.prototype, 'setContent');
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('[data-bs-toggle="popover"]');

    el.setAttribute('aria-describedby', 'popover-123');
    await new Promise(resolve => setTimeout(resolve));
    expect(setContent).not.toHaveBeenCalled();
  });

  it('should dispose the Bootstrap Popover when destroyed', () => {
    const dispose = jest.spyOn(Popover.prototype, 'dispose');
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    fixture.destroy();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
