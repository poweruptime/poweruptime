import {expect, request, test} from '@playwright/test';

import {getTempNotification} from './tempNotifications';

test('setup', async ({page}) => {
  await page.goto('/');

  await new Promise((resolve) => setTimeout(resolve, 1000));

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

  const apiContext = await request.newContext();

  // Get most recent notification containing setup link
  const {body: otpNotificationBody} = await getTempNotification(apiContext, ({body}) =>
    body.includes('http://localhost:4200/setup'),
  );

  const otpUrl = new URL(otpNotificationBody.match(/http:\/\/localhost:4200\/setup\?[^"]+/)![0]);
  const code = otpUrl.searchParams.get('code');
  expect(code).not.toBeNull();

  // Enter OTP
  await page.fill('#email-test-code-input', code!);

  const sendEmailTestCodeButton = page.locator('#email-test-code-button');
  await expect(sendEmailTestCodeButton).toHaveText(/Send Invitation/i);
  await sendEmailTestCodeButton.click();

  // Enter first admin user data
  await page.fill('#name', 'admin E2E');
  await page.fill('#email', 'admin@admin.org');

  const sendInviteButton = page.locator('#send-invite-button');
  await sendInviteButton.click();
  await expect(
    page.locator(
      '#body > app-root > auth-layout > div > main > pu-setup-page > mat-card > mat-card-content > div > div.rounded-lg.p-4.text-sm.dark\\:bg-gray-800.bg-blue-100.text-blue-800.dark\\:text-blue-400 > b',
    ),
  ).toHaveText('An invitation will be sent to the specified email address.');

  // Set first password for newly created user
  const {body: loginNotificationBody} = await getTempNotification(apiContext, ({body}) =>
    body.includes('http://localhost:4200/auth/login?email='),
  );
  const loginUrl = loginNotificationBody.match(/http:\/\/localhost:4200\/auth\/login\?[^"]+/)![0];
  expect(loginUrl).not.toBeNull();
  await page.goto(loginUrl);

  await page.fill('#mat-input-4', 'Passwort1234');
  await page.fill('#mat-input-5', 'Passwort1234');

  const passwordChangeSubmitButton = page.locator(
    '#body > app-root > auth-layout > div > main > password-change-login-page > mat-card > mat-card-content > form > div.flex.flex-col.gap-3 > button',
  );
  await passwordChangeSubmitButton.click();
});
