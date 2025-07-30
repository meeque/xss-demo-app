import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ComboboxInputComponent, MenuGroup, MenuItem } from './combobox-input.component';

describe('ComboboxInputComponent', () => {
  let fixture: ComponentFixture<ComboboxInputComponent>;
  let component: ComboboxInputComponent;
  let element: HTMLElement;
  let textInput: HTMLInputElement;
  let menuPopover: HTMLElement;
  let menuButton: HTMLButtonElement;

  let selectedValue: string;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ComboboxInputComponent],
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(ComboboxInputComponent);
    fixture.detectChanges();

    component = fixture.componentInstance;
    element = fixture.nativeElement;
    textInput = element.querySelector('input[type=text]');
    menuPopover = element.querySelector('div.fd-popover__body');
    menuButton = element.querySelector('button');
  });

  describe('initially', () => {
    it('should be created', () => {
      expect(component).toBeDefined();
    });

    it('should hide menu', () => {
      expect(menuPopover.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have no menu items or groups', () => {
      expect(component.items()).toEqual([]);
      expect(component.groups()).toEqual([]);
    });

    it('should have empty value', () => {
      expect(textInput.value).toBe('');
    });

    it('should have empty placeholder', () => {
      expect(textInput.value).toBe('');
    });
  });

  describe('with plain menu items', () => {
    const plainMenuItems: MenuItem<string>[] = [
      {
        name: 'First Menu Item: One',
        value: 'value one',
        select: selectValue,
      },
      {
        name: 'Another Menu Item: Two',
        value: 'value two',
        select: selectValue,
      },
      {
        name: 'Another Menu Item: Three',
        value: 'value three',
        select: selectValue,
      },
    ];

    beforeEach(() => {
      fixture.componentRef.setInput('items', plainMenuItems);
      fixture.detectChanges();
    });

    it('should initially hide menu', () => {
      expect(menuPopover.getAttribute('aria-hidden')).toBe('true');
    });

    it('should show menu when button is clicked', () => {
      menuButton.dispatchEvent(new Event('click'));
      fixture.detectChanges();
      expect(menuPopover.getAttribute('aria-hidden')).toBe('false');
    });

    it('should show menu when query text input gets focus', () => {
      textInput.dispatchEvent(new Event('focus'));
      fixture.detectChanges();
      expect(menuPopover.getAttribute('aria-hidden')).toBe('false');
    });

    it('should display a list item for each menu item', () => {
      const listItems = queryMenuListsItems().plain;

      expect(listItems.length).toBe(plainMenuItems.length);

      for (const [i, menuItem] of plainMenuItems.entries()) {
        expect(listItems[i].querySelector('a').textContent.trim()).toBe(menuItem.name);
      }
    });

    it('should not display any grouped menu items', () => {
      expect(queryMenuListsItems().grouped.length).toBe(0);
    });

    it('should select value when menu items are clicked', () => {
      const listItems = queryMenuListsItems().plain;

      for (const [i, menuItem] of plainMenuItems.entries()) {
        listItems[i].querySelector('a').dispatchEvent(new Event('click'));
        expect(selectedValue).toBe(menuItem.value);
      }
    });

    it('should adjust placeholder when menu items are clicked', () => {
      for (const [i, menuItem] of plainMenuItems.entries()) {
        queryMenuListsItems().plain[i].querySelector('a').dispatchEvent(new Event('click'));
        fixture.detectChanges();
        expect(textInput.placeholder).toBe(menuItem.name);
      }
    });

    describe('and default name-based menu item filter', () => {
      it('should display full menu when query is empty', () => {
        enterQuery('');
        expect(queryMenuListsItems().plain).toHaveLength(plainMenuItems.length);
      });

      it('should display empty menu when query is mismatched', () => {
        enterQuery('foo');
        expect(queryMenuListsItems().plain).toHaveLength(0);
      });

      it('should only display menu items that match query', () => {
        expect(queryMenuListsItems().plain).toHaveLength(plainMenuItems.length);
        enterQuery('Menu Item');
        expect(queryMenuListsItems().plain).toHaveLength(3);
        enterQuery('First');
        expect(queryMenuListsItems().plain).toHaveLength(1);
        enterQuery('Another');
        expect(queryMenuListsItems().plain).toHaveLength(2);
      });
    });
  });

  describe('with grouped menu items', () => {
    const groupedMenuItems: MenuGroup<string, string>[] = [
      {
        name: 'Menu Group A',
        value: 'value a',
        items: [
          {
            name: 'Menu Item A One',
            value: 'value a1',
            select: selectValue,
          },
          {
            name: 'Menu Item A Two',
            value: 'value a2',
            select: selectValue,
          },
        ],
      },
      {
        name: 'Menu Group B',
        value: 'value b',
        items: [
          {
            name: 'Menu Item B One',
            value: 'value b1',
            select: selectValue,
          },
          {
            name: 'Menu Item B Two',
            value: 'value b2',
            select: selectValue,
          },
          {
            name: 'Menu Item B Three',
            value: 'value b3',
            select: selectValue,
          },
        ],
      },
      {
        name: 'Menu Group C',
        value: 'group c',
        items: [],
      },
    ];

    beforeEach(() => {
      fixture.componentRef.setInput('groups', groupedMenuItems);
      fixture.detectChanges();
    });

    it('should not display any plain menu items', () => {
      expect(queryMenuListsItems().plain.length).toBe(0);
    });

    it('should display a header for each group', () => {
      const groupHeaders = element.querySelectorAll('div.fd-list__group-header');

      expect(groupHeaders.length).toBe(groupedMenuItems.length);

      for (const [i, menuGroup] of groupedMenuItems.entries()) {
        expect(groupHeaders[i].querySelector('span').textContent.trim()).toBe(menuGroup.name);
      }
    });

    it('should display list items for of each group', () => {
      const groupListItems = queryMenuListsItems().grouped;

      for (const [i, menuGroup] of groupedMenuItems.entries()) {
        expect(groupListItems[i].length).toBe(menuGroup.items.length);

        for (const [j, menuItem] of menuGroup.items.entries()) {
          expect(groupListItems[i][j].querySelector('a').textContent.trim()).toBe(menuItem.name);
        }
      }
    });

    it('should select value when menu items are clicked', () => {
      const groupListItems = queryMenuListsItems().grouped;

      for (const [i, menuGroup] of groupedMenuItems.entries()) {
        for (const [j, menuItem] of menuGroup.items.entries()) {
          groupListItems[i][j].querySelector('a').dispatchEvent(new Event('click'));
          expect(selectedValue).toBe(menuItem.value);
        }
      }
    });

    it('should adjust placeholder when menu item are clicked', () => {
      for (const [i, menuGroup] of groupedMenuItems.entries()) {
        for (const [j, menuItem] of menuGroup.items.entries()) {
          queryMenuListsItems().grouped[i][j].querySelector('a').dispatchEvent(new Event('click'));
          fixture.detectChanges();
          expect(textInput.placeholder).toBe(menuItem.name);
        }
      }
    });
  });

  function selectValue(item: MenuItem<string>): boolean {
    selectedValue = item.value;
    return true;
  }

  function enterQuery(text: string): void {
    textInput.value = text;
    textInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function queryMenuListsItems(): { plain: HTMLElement[], grouped: HTMLElement[][] } {
    const menuLists = element.querySelectorAll('ul');
    const [plainList, ...groupLists] = menuLists.values();

    const plainListItems: HTMLElement[] = Array.from(plainList.querySelectorAll('li'));
    const groupListsItems: HTMLElement[][] = groupLists.map(list => Array.from(list.querySelectorAll('li')));

    return { plain: plainListItems, grouped: groupListsItems };
  }
});
