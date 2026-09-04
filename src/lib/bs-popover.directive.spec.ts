import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BsPopoverDirective } from './bs-popover.directive';

jest.mock('bootstrap', () => {
  const MockPopover = jest.fn();
  MockPopover.getInstance = jest.fn();
  MockPopover.getOrCreateInstance = jest.fn();
  return { Popover: MockPopover };
});

import { Popover } from 'bootstrap';

@Component({
  template: '<span data-bs-toggle="popover" data-bs-content="Test">Help</span>',
  imports: [BsPopoverDirective],
  standalone: true,
})
class TestHostComponent {}

describe('BsPopoverDirective', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
    await TestBed.compileComponents();
  });

  it('should initialize a Bootstrap Popover on the host element', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-bs-toggle="popover"]');
    expect(Popover.getOrCreateInstance).toHaveBeenCalledWith(el);
  });

  it('should dispose the Bootstrap Popover when destroyed', () => {
    const mockDispose = jest.fn();
    jest.mocked(Popover.getInstance).mockReturnValue({ dispose: mockDispose } as unknown as InstanceType<typeof Popover>);
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    fixture.destroy();
    expect(mockDispose).toHaveBeenCalledTimes(1);
  });
});
