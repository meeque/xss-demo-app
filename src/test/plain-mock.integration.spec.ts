import { By, WebElement, until } from 'selenium-webdriver';



describe('Plain Mock', () => {
  let mockPageBody: WebElement = null;

  beforeEach(async () => {
    await driver.get(xssDemoAppUrl + 'assets/mocks/plain.html');
    mockPageBody = await driver.wait(until.elementLocated(By.css('body')), 2500);
  });

  test('is loaded', () => {
    expect(mockPageBody).toBeDefined();
    expect(mockPageBody).not.toBeNull();
  });
});
