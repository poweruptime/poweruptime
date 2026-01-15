import {expect, request, test} from '@playwright/test';
import {thr_sleep} from 'dfts-helper';

import {getTempNotification} from './tempNotifications';

test('setup', async ({page}) => {
  await page.goto('/');

  await thr_sleep(500);

  test.skip(
    page.url() === 'http://localhost:4200/auth/login',
    `Backend environment is already setup, skipping setup tests...`,
  );

  expect(page.url()).toBe('http://localhost:4200/setup');

  // Fill the email field
  await page.fill('#test-email', 'admin@admin.org');

  // Submit the setup request
  const sendEmailTestButton = page.locator('#email-test-button');
  await expect(sendEmailTestButton).toHaveText(/Send Test/i);
  await sendEmailTestButton.click();

  await thr_sleep(500);

  const apiContext = await request.newContext();

  // Get most recent notification containing setup link
  const {body: otpNotificationBody} = await getTempNotification(apiContext, ({body}) =>
    body.includes('http://localhost:4200/setup'),
  );

  const otpUrl = new URL(otpNotificationBody.match(/http:\/\/localhost:4200\/setup\?[^"]+/)![0]);
  const code = otpUrl.searchParams.get('code');
  expect(code).not.toBeNull();

  // Enter OTP
  await page.fill('#email-test-code-input > div:nth-child(4) > input', code!);

  const sendEmailTestCodeButton = page.locator('#email-test-code-button');
  await expect(sendEmailTestCodeButton).toHaveText(/Verify Code/i);
  await sendEmailTestCodeButton.click();

  // Enter first admin user data
  await page.fill('#name', 'admin E2E');
  await page.fill('#email', 'admin@admin.org');

  const sendInviteButton = page.locator('#send-invite-button');
  await sendInviteButton.click();

  await thr_sleep(500);

  // Set first password for newly created user
  const {body: loginNotificationBody} = await getTempNotification(apiContext, ({body}) =>
    body.includes('http://localhost:4200/auth/login?email='),
  );
  const loginUrl = loginNotificationBody.match(/http:\/\/localhost:4200\/auth\/login\?[^"]+/)![0];
  expect(loginUrl).not.toBeNull();
  await page.goto(loginUrl);

  await page.fill('#newPassword', 'Passwort1234');
  await page.fill('#newPasswordConfirm', 'Passwort1234');

  const passwordChangeSubmitButton = page.locator('#password-change-button');
  await passwordChangeSubmitButton.click();
});
