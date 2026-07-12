import { Component, TemplateRef, input, model, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';



export interface MenuEntry<V> {
  name: string
  value: V
}


export interface MenuItem<V> extends MenuEntry<V> {
  select: (item: MenuItem<V>, event?: Event) => boolean
  filter?: (item: MenuItem<V>, query: string) => boolean
  template?: TemplateRef<MenuItemContext>
}


export interface MenuGroup<V, W> extends MenuEntry<V> {
  items: MenuItem<W>[]
}


export class MenuItemContext {
  constructor(
    public $implicit: ComboboxInputComponent,
    public item: MenuItem<unknown>,
  ) {
  }
}



@Component({
  selector: 'xss-combobox-input',
  templateUrl: './combobox-input.component.html',
  styleUrl: './combobox-input.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, NgTemplateOutlet],
})
export class ComboboxInputComponent {
  private static nextComponentId = 0;
  protected readonly componentId = ComboboxInputComponent.nextComponentId++;


  readonly items = input<MenuItem<unknown>[]>([]);
  readonly groups = input<MenuGroup<unknown, unknown>[]>([]);
  readonly placeholder = model<string>(null);

  protected readonly query = model<string>(null);
  protected readonly menuExpanded = model(false);


  protected toggleMenu(show?: boolean) {
    if (typeof show === 'undefined') {
      this.menuExpanded.set(!this.menuExpanded());
    }
    else {
      this.menuExpanded.set(show);
    }
  }

  protected itemContext(item: MenuItem<unknown>): MenuItemContext {
    return new MenuItemContext(this, item);
  }

  protected filter(item: MenuItem<unknown>) {
    if (item.filter) {
      return item.filter(item, this.query());
    }
    else {
      return this.defaultItemFilter(item, this.query());
    }
  }

  private defaultItemFilter(item: MenuItem<unknown>, query: string) {
    if (query) {
      return item.name.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  }

  protected select(item: MenuItem<unknown>, event?: Event) {
    this.toggleMenu(false);
    this.query.set('');
    this.placeholder.set(item.name);

    // trigger item's select handler asynchronously,
    // otherwise errors in the handler might interfere
    // with combobox input functionality,
    // such as toggling the menu
    setTimeout(
      () => item.select(item, event),
    );
  }
}
