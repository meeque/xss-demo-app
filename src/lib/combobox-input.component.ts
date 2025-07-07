import { Component, ViewContainerRef, ChangeDetectorRef, TemplateRef, AfterViewChecked, inject, input, model, viewChildren, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';



export interface MenuEntry<V> {
  name : string;
  value : V;
}


export interface MenuItem<V> extends MenuEntry<V> {
  select : (item : MenuItem<V>, event? : Event) => boolean;
  filter? : (item : MenuItem<V>, query : string) => boolean;
  template? : TemplateRef<MenuItemContext>;
}


export interface MenuGroup<V,W> extends MenuEntry<V> {
  items : MenuItem<W>[];
}


export class MenuListContext {
  constructor(
      public $implicit : ComboboxInputComponent,
      public items : MenuItem<unknown>[]) {
  }
}


export class MenuItemContext {
  constructor(
      public $implicit : ComboboxInputComponent,
      public item : MenuItem<unknown>) {
  }
}



@Component({
    selector: 'xss-combobox-input',
    templateUrl: './combobox-input.component.html',
    styleUrl: './combobox-input.component.css',
    standalone: true,
    imports: [FormsModule]
})
export class ComboboxInputComponent implements AfterViewChecked {

  private static nextComponentId = 0;
  protected readonly componentId = ComboboxInputComponent.nextComponentId++;


  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly items = input<MenuItem<unknown>[]>([]);
  readonly groups = input<MenuGroup<unknown, unknown>[]>([]);
  readonly placeholder = model<string>(null);

  protected readonly query = model<string>(null);
  protected readonly menuExpanded = model(false);

  private readonly menuListContainers = viewChildren('menuList', { read: ViewContainerRef });
  private readonly menuItemContainers = viewChildren('menuItem', { read: ViewContainerRef });
  private readonly defaultMenuListTemplate = viewChild<TemplateRef<MenuListContext>>('defaultMenuList');
  private readonly defaultMenuItemTemplate = viewChild<TemplateRef<MenuItemContext>>('defaultMenuItem');


  ngAfterViewChecked() {

    this.menuListContainers().forEach(
        (menuListContainer) => {

            menuListContainer.clear();
            this.menuItemContainers().forEach(
                (menuItemContainer) => {
                  menuItemContainer.clear();
                }
            );
        }
    );

    let nextMenuItem = 0;

    this.menuListContainers().forEach(
        (menuListContainer, listIndex) => {

          const listItems = (listIndex == 0) ? this.items() : this.groups()[listIndex -1].items;
          menuListContainer.createEmbeddedView<MenuListContext>(
              this.defaultMenuListTemplate(),
              new MenuListContext(this, listItems));

          this.changeDetector.detectChanges();

          this.menuItemContainers().forEach(
              (menuItemContainer, itemIndex) => {

                if (itemIndex >= nextMenuItem) {
                  const menuItem = listItems[itemIndex - nextMenuItem];
                  const template = menuItem.template || this.defaultMenuItemTemplate();
                  menuItemContainer.createEmbeddedView<MenuItemContext>(
                      template,
                      new MenuItemContext(this, menuItem));
                }
              }
          );

          nextMenuItem = this.menuItemContainers().length;
        }
    );
    this.changeDetector.detectChanges();
  }


  protected toggleMenu(show?: boolean) {
    if (typeof show === 'undefined') {
      this.menuExpanded.set(!this.menuExpanded());
    }
    else {
      this.menuExpanded.set(show);
    }
  }

  protected filter(item : MenuItem<unknown>) {
    if (item.filter) {
      return item.filter(item, this.query());
    }
    else {
      return this.defaultItemFilter(item, this.query())
    }
  }

  private defaultItemFilter(item : MenuItem<unknown>, query : string) {
    if (query) {
      return item.name.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  }

  protected select(item : MenuItem<unknown>, event? : Event) {
    this.toggleMenu(false);
    this.query.set('');
    this.placeholder.set(item.name);
    return item.select(item, event);
  }
}
