import { NgFor, NgIf } from '@angular/common';
import { Component, Input, ViewChild, ViewChildren, QueryList, ViewContainerRef, ChangeDetectorRef, TemplateRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';


export interface MenuEntry<V> {
  name : string;
  value : V;
}


export interface MenuItem<V> extends MenuEntry<V> {
  select : (item : MenuItem<V>, $event? : any) => boolean;
  filter? : (item : MenuItem<V>, query : string) => boolean;
  template? : TemplateRef<MenuItemContext>;
}


export interface MenuGroup<V,W> extends MenuEntry<V> {
  items : MenuItem<W>[];
}


export class MenuListContext {
  constructor(
      public $implicit : ComboboxInputComponent,
      public items : MenuItem<any>[]) {
  }
}


export class MenuItemContext {
  constructor(
      public $implicit : ComboboxInputComponent,
      public item : MenuItem<any>) {
  }
}


@Component({
    selector: 'combobox-input',
    templateUrl: './combobox-input.component.html',
    styleUrl: './combobox-input.component.css',
    standalone: true,
    imports: [FormsModule, NgFor, NgIf]
})
export class ComboboxInputComponent implements AfterViewChecked {

  static nextComponentId : number = 0;

  componentId : number = ComboboxInputComponent.nextComponentId++;

  @ViewChildren('menuList', {read: ViewContainerRef})
  menuListContainers : QueryList<ViewContainerRef>;

  @ViewChildren('menuItem', {read: ViewContainerRef})
  menuItemContainers : QueryList<ViewContainerRef>;

  @ViewChild('defaultMenuList')
  defaultMenuListTemplate : TemplateRef<MenuListContext>;

  @ViewChild('defaultMenuItem')
  defaultMenuItemTemplate : TemplateRef<MenuItemContext>;

  @Input()
  query : string = null;

  @Input()
  items : MenuItem<any>[] = [];

  @Input()
  groups : MenuGroup<any, any>[] = [];

  @Input()
  placeholder : string = null;

  showMenu : boolean = false;

  constructor(
      private readonly _changeDetector : ChangeDetectorRef) {
  }

  ngAfterViewChecked() {

    this.menuListContainers.forEach(
        (menuListContainer, listIndex) => {

            menuListContainer.clear();
            this.menuItemContainers.forEach(
                (menuItemContainer, itemIndex) => {
                  menuItemContainer.clear();
                }
            );
        }
    );

    let nextMenuItem = 0;

    this.menuListContainers.forEach(
        (menuListContainer, listIndex) => {

          const listItems = (listIndex == 0) ? this.items : this.groups[listIndex -1].items;
          menuListContainer.createEmbeddedView<MenuListContext>(
              this.defaultMenuListTemplate,
              new MenuListContext(this, listItems));

          this._changeDetector.detectChanges();

          this.menuItemContainers.forEach(
              (menuItemContainer, itemIndex) => {

                if (itemIndex >= nextMenuItem) {
                  const menuItem = listItems[itemIndex - nextMenuItem];
                  const template = menuItem.template || this.defaultMenuItemTemplate;
                  menuItemContainer.createEmbeddedView<MenuItemContext>(
                      template,
                      new MenuItemContext(this, menuItem));
                }
              }
          );

          nextMenuItem = this.menuItemContainers.length;
        }
    );
    this._changeDetector.detectChanges();
  }

  toggleMenu(show?: boolean) {
    if (typeof show === 'undefined') {
      this.showMenu = !this.showMenu;
    }
    else {
      this.showMenu = show;
    }
  }

  filter(item : MenuItem<any>) {
    if (item.filter) {
      return item.filter(item, this.query);
    }
    else {
      return this.defaultItemFilter(item, this.query)
    }
  }

  private defaultItemFilter(item : MenuItem<any>, query : string) {
    if (query) {
      return item.name.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  }

  select(item : MenuItem<any>, $event? : any) {
    this.toggleMenu(false);
    this.query = '';
    this.placeholder = item.name;
    return item.select(item, $event);
  }
}
