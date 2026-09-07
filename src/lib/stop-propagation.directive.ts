import { Directive, HostListener } from '@angular/core';



@Directive({
  selector: '[xssStopPropagation]',
  standalone: true,
})
export class StopPropagationDirective {
  @HostListener('click', ['$event'])
  @HostListener('keydown', ['$event'])
  stop(event: Event): void {
    event.stopPropagation();
  }
}
