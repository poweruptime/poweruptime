import {expect, test} from '@playwright/test';

test('setup has title and accessible via preview', async ({page}) => {
  await page.goto('/setup?preview=true');

  await expect(page).toHaveTitle(/poweruptime/);

  const title = page.locator('#title');
  await expect(title).toHaveText('poweruptime');
});

test('user profile', async ({page}) => {
  await page.goto('/m');

  const sidebarButton = page.locator('#sidebar-trigger');
  const isSidebarOpen = (await sidebarButton.getAttribute('data-sidebar-open')) === 'true';
  if (!isSidebarOpen) {
    await sidebarButton.click();
  }

  const profileMenuButton = page.locator('#profile-menu-button');
  await profileMenuButton.click();

  const profileSettingsMenuButton = page.locator(
    '[data-id="profile-menu"] > hlm-dropdown-menu-group:nth-child(5) > button:nth-child(1)',
  );
  await profileSettingsMenuButton.click();

  await page.waitForURL('/profile');
  expect(page.url()).toMatch('/profile');

  const title = page.locator(
    '#body > app-root > home-layout > pu-sidebar > div > main > div > profile-layout > div > div > h1',
  );
  await expect(title).toHaveText('Profile Settings');
});
