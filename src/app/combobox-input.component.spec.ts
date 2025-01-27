import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ComboboxInputComponent, MenuItem } from './combobox-input.component';

describe('ComboboxInputComponent', () => {

  let fixture : ComponentFixture<ComboboxInputComponent>;
  let component : ComboboxInputComponent;
  let element : HTMLElement;

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

    let selectedValue : string;

    function selectValue(item : MenuItem<string>) : boolean {
      selectedValue = item.value;
      return true; 
    }

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
});