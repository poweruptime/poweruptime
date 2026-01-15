import {expect, test} from '@playwright/test';
import {thr_sleep} from 'dfts-helper';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

test('authenticate', async ({page}) => {
  await page.goto('/');

  await thr_sleep(500);

  expect(page.url()).toBe('http://localhost:4200/auth/login');

  await page.fill('#email', 'admin@admin.org');
  await page.fill('#password', 'Passwort1234');

  await page.locator('#login-button').click();

  await page.waitForURL('/m');
  expect(page.url()).toMatch(/\/m/);

  await page.context().storageState({path: authFile});
});
