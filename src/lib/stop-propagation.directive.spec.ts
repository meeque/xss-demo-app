import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StopPropagationDirective } from './stop-propagation.directive';

@Component({
  template: '<span xssStopPropagation>Click</span>',
  imports: [StopPropagationDirective],
  standalone: true,
})
class TestHostComponent {}

describe('StopPropagationDirective', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
    await TestBed.compileComponents();
  });

  it('should stop propagation on click and keydown events', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('[xssStopPropagation]');

    for (const type of ['click', 'keydown'] as const) {
      const event = new Event(type, { bubbles: true });
      jest.spyOn(event, 'stopPropagation');
      el.dispatchEvent(event);
      expect(event.stopPropagation).toHaveBeenCalled();
    }
  });
});
