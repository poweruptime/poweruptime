import {expect, request, test} from '@playwright/test';

test('has title', async ({page}) => {
  await page.goto('/setup?preview=true');

  await expect(page).toHaveTitle(/poweruptime/);

  const title = page.locator(
    '#body > app-root > auth-layout > div > main > pu-setup-page > mat-card > mat-card-header > div > mat-card-title > span > strong',
  );
  await expect(title).toHaveText('poweruptime');
});

test('complete setup and open invitation link', async ({page}) => {
  await page.goto('/setup');

  // Fill the email field
  await page.fill('#mat-input-0', 'admin@admin.org');

  // Submit the setup request
  const submitButton = page.locator(
    '#body > app-root > auth-layout > div > main > pu-setup-page > mat-card > mat-card-content > div > form > button',
  );

  await expect(submitButton).toHaveText(/Send Test/i);
  await submitButton.click();
  await expect(submitButton).toHaveText(/Verify Code/i);

  // --- Step 1: Fetch notification with OTP ---
  const apiContext = await request.newContext();
  const response1 = await apiContext.get('http://localhost:8080/api/v1/public/temp-notification');
  expect(response1.ok()).toBeTruthy();

  const notifications1: Array<{
    id: string;
    url: string;
    createdAt: string;
    to: string;
    subject: string;
    body: string;
    bodyHTML: string;
  }> = await response1.json();

  // Get most recent notification containing setup link
  const otpNotif = notifications1.find((n) => n.body.includes('http://localhost:4200/setup'));
  expect(otpNotif).toBeTruthy();

  const otpUrl = new URL(otpNotif!.body.match(/http:\/\/localhost:4200\/setup\?[^"]+/)![0]);
  const code = otpUrl.searchParams.get('code');
  expect(code).not.toBeNull();

  // Enter OTP
  await page.fill('#input-otp-0', code!);
  await submitButton.click();
  await expect(submitButton).toHaveText(/Send Invitation/i);
});
