import { AfterViewInit, Directive, ElementRef, HostListener, OnDestroy, inject } from '@angular/core';
import { Popover } from 'bootstrap';



@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[data-bs-toggle="popover"]',
  standalone: true,
})
export class BsPopoverDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly observer = new MutationObserver(() => this.syncContent());

  ngAfterViewInit(): void {
    Popover.getOrCreateInstance(this.el.nativeElement);
    this.observer.observe(this.el.nativeElement, { attributes: true });
  }

  ngOnDestroy(): void {
    this.observer.disconnect();
    Popover.getInstance(this.el.nativeElement)?.dispose();
  }

  @HostListener('click', ['$event'])
  @HostListener('keydown', ['$event'])
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  private syncContent(): void {
    const el = this.el.nativeElement;
    Popover.getInstance(el)?.setContent({
      '.popover-header': el.getAttribute('data-bs-title'),
      '.popover-body': el.getAttribute('data-bs-content'),
    });
  }
}
