import {APIRequestContext, expect} from '@playwright/test';

interface TempNotification {
  id: string;
  url: string;
  createdAt: string;
  to: string;
  subject: string;
  body: string;
  bodyHTML: string;
}

export async function getTempNotification(
  apiContext: APIRequestContext,
  find: (it: TempNotification) => boolean,
) {
  const notifications = await getTempNotifications(apiContext);
  const notification = notifications.find(find);

  expect(notification).toBeTruthy();

  return notification!;
}

async function getTempNotifications(apiContext: APIRequestContext) {
  const response = await apiContext.get('http://localhost:8080/api/v1/public/temp-notification');
  expect(response.ok()).toBeTruthy();

  return (await response.json()) as TempNotification[];
}
