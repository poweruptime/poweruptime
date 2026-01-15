import {expect, test} from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

test('authenticate', async ({page}) => {
  await page.goto('/');

  await new Promise((resolve) => setTimeout(resolve, 1000));

  expect(page.url()).toBe('http://localhost:4200/auth/login');

  await page.fill('#email', 'admin@admin.org');
  await page.fill('#password', 'Passwort1234');

  await page.locator('#login-button').click();

  await page.waitForURL('/m');
  expect(page.url()).toMatch(/\/m/);

  await page.context().storageState({path: authFile});
});
