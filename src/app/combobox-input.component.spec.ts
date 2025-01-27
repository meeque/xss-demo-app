import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ComboboxInputComponent, MenuGroup, MenuItem } from './combobox-input.component';

describe('ComboboxInputComponent', () => {

  let fixture : ComponentFixture<ComboboxInputComponent>;
  let component : ComboboxInputComponent;
  let element : HTMLElement;

  let selectedValue : string;

  function selectValue(item : MenuItem<string>) : boolean {
    selectedValue = item.value;
    return true;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ComboboxInputComponent]
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(ComboboxInputComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  describe('initially', () => {

    it('should be created', () => {
      expect(component).toBeDefined();
    });

    it('should have no menu items or groups', () => {
      expect(component.items).toEqual([]);
      expect(component.groups).toEqual([]);
    });

    it('should have empty value', () => {
      expect(element.querySelector('input')?.value).toEqual('');
    });

    it('should have empty placeholder', () => {
      expect(element.querySelector('input')?.value).toEqual('');
    });
  });

  describe('with plain menu items', () => {

    const plainMenuItems : MenuItem<string>[] = [
      {
        name : 'Menu Item One',
        value : 'value one',
        select : selectValue
      },
      {
        name : 'Menu Item Two',
        value : 'value two',
        select : selectValue
      },
      {
        name : 'Menu Item Three',
        value : 'value three',
        select : selectValue
      }
    ];

    beforeEach(() => {
      component.items = plainMenuItems;
      fixture.detectChanges();
    });

    it('should display a list item for each menu item', () => {
      const listItems = element.querySelectorAll('ul li');
  
      expect(listItems.length).toEqual(plainMenuItems.length);

      expect(listItems[0].querySelector('a').textContent).toBe(plainMenuItems[0].name);
      expect(listItems[1].querySelector('a').textContent).toBe(plainMenuItems[1].name);
      expect(listItems[2].querySelector('a').textContent).toBe(plainMenuItems[2].name);
    });

    it('should select value when menu item is clicked', () => {
      const listItems = element.querySelectorAll('ul li');

      listItems[0].querySelector('a').click();
      expect(selectedValue).toBe(plainMenuItems[0].value);
      listItems[1].querySelector('a').click();
      expect(selectedValue).toBe(plainMenuItems[1].value);
      listItems[2].querySelector('a').click();
      expect(selectedValue).toBe(plainMenuItems[2].value);
    });

    it('should adjust placeholder when menu item is clicked', () => {
      element.querySelectorAll('ul li')[0].querySelector('a').click();
      fixture.detectChanges();
      expect(element.querySelector('input').placeholder).toBe(plainMenuItems[0].name);

      element.querySelectorAll('ul li')[1].querySelector('a').click();
      fixture.detectChanges();
      expect(element.querySelector('input').placeholder).toBe(plainMenuItems[1].name);

      element.querySelectorAll('ul li')[2].querySelector('a').click();
      fixture.detectChanges();
      expect(element.querySelector('input').placeholder).toBe(plainMenuItems[2].name);
    });
  });

  describe('with grouped menu items', () => {

    const groupedMenuItems : MenuGroup<string>[] = [
      {
        name : 'Menu Group A',
        value : 'value a',
        items : [
          {
            name : 'Menu Item A One',
            value : 'value a1',
            select : selectValue
          },
          {
            name : 'Menu Item A Two',
            value : 'value a2',
            select : selectValue
          }
        ]
      },
      {
        name : 'Menu Group B',
        value : 'value b',
        items : [
          {
            name : 'Menu Item B One',
            value : 'value b1',
            select : selectValue
          },
          {
            name : 'Menu Item B Two',
            value : 'value b2',
            select : selectValue
          },
          {
            name : 'Menu Item B Three',
            value : 'value b3',
            select : selectValue
          }
        ]
      },
      {
        name : 'Menu Group C',
        value : 'group c',
        items : []
      }
    ];

    beforeEach(() => {
      component.groups = groupedMenuItems;
      fixture.detectChanges();
    });

    it('should display a header for each group', () => {
      const groupHeaders = element.querySelectorAll('label.fd-list__group-header');

      expect(groupHeaders.length).toEqual(groupedMenuItems.length);

      expect(groupHeaders[0].querySelector('span').textContent).toBe(groupedMenuItems[0].name);
      expect(groupHeaders[1].querySelector('span').textContent).toBe(groupedMenuItems[1].name);
      expect(groupHeaders[2].querySelector('span').textContent).toBe(groupedMenuItems[2].name);
    });

    it('should display a list for of each group', () => {
      const menuLists = element.querySelectorAll('ul');

      // split off leading list of ungrouped menu items
      let plainList : HTMLElement;
      let groupLists : HTMLElement[];
      [plainList, ... groupLists] = menuLists.values();

      expect(plainList.querySelectorAll('li').length).toEqual(0);
      expect(groupLists.length).toEqual(groupedMenuItems.length);

      let groupListItems : HTMLElement[][] = [];
      [... groupListItems[0]] = groupLists[0].querySelectorAll('li').values();
      [... groupListItems[1]] = groupLists[1].querySelectorAll('li').values();
      [... groupListItems[2]] = groupLists[2].querySelectorAll('li').values();

      expect(groupListItems[0].length).toBe(groupedMenuItems[0].items.length);
      expect(groupListItems[0][0].querySelector('a').textContent).toBe(groupedMenuItems[0].items[0].name);
      expect(groupListItems[0][1].querySelector('a').textContent).toBe(groupedMenuItems[0].items[1].name);

      expect(groupListItems[1].length).toBe(groupedMenuItems[1].items.length);
      expect(groupListItems[1][0].querySelector('a').textContent).toBe(groupedMenuItems[1].items[0].name);
      expect(groupListItems[1][1].querySelector('a').textContent).toBe(groupedMenuItems[1].items[1].name);
      expect(groupListItems[1][2].querySelector('a').textContent).toBe(groupedMenuItems[1].items[2].name);

      expect(groupListItems[2].length).toBe(groupedMenuItems[2].items.length);
    });

  });
});
