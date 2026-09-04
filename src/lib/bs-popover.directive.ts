import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';
import { Popover } from 'bootstrap';



@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[data-bs-toggle="popover"]',
  standalone: true,
})
export class BsPopoverDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  ngAfterViewInit(): void {
    Popover.getOrCreateInstance(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    Popover.getInstance(this.el.nativeElement)?.dispose();
  }
}
