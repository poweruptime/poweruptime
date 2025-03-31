import {Validators} from '@angular/forms';

import {Database} from '@app/api';

// Number of seconds in a day
const SECONDS_IN_DAY = 86400;
// Number of seconds in an hour
const SECONDS_IN_HOUR = 3600;
// Number of seconds in a minute
const SECONDS_IN_MINUTE = 60;

export type TestIntervalUnits = 'seconds' | 'minutes' | 'hours' | 'days';

export function getTestIntervalSeconds(
  testInterval: number,
  testIntervalUnit: TestIntervalUnits,
): number {
  switch (testIntervalUnit) {
    case 'days':
      return testInterval * SECONDS_IN_DAY;
    case 'hours':
      return testInterval * SECONDS_IN_HOUR;
    case 'minutes':
      return testInterval * SECONDS_IN_MINUTE;
    case 'seconds':
    default:
      return testInterval;
  }
}

export function getTestInterval(testIntervalInSeconds: number): {
  testInterval: number;
  testIntervalUnit: TestIntervalUnits;
} {
  // Check if it is a whole number of days
  if (testIntervalInSeconds % SECONDS_IN_DAY === 0) {
    return {
      testInterval: testIntervalInSeconds / SECONDS_IN_DAY,
      testIntervalUnit: 'days',
    };
  }
  // Check if it is a whole number of hours
  else if (testIntervalInSeconds % SECONDS_IN_HOUR === 0) {
    return {
      testInterval: testIntervalInSeconds / SECONDS_IN_HOUR,
      testIntervalUnit: 'hours',
    };
  }
  // Check if it is a whole number of minutes
  else if (testIntervalInSeconds % SECONDS_IN_MINUTE === 0) {
    return {
      testInterval: testIntervalInSeconds / SECONDS_IN_MINUTE,
      testIntervalUnit: 'minutes',
    };
  }
  // Otherwise, default to seconds
  else {
    return {
      testInterval: testIntervalInSeconds,
      testIntervalUnit: 'seconds',
    };
  }
}

export const testIntervalSecondsValidators = [
  Validators.min(Database.MIN_TEST_INTERVAL_SECONDS),
  Validators.max(Database.MAX_TEST_INTERVAL_SECONDS),
];
export const testIntervalMinutesValidators = [
  Validators.min(1),
  Validators.max(Database.MAX_TEST_INTERVAL_SECONDS / SECONDS_IN_MINUTE),
];
export const testIntervalHoursValidators = [
  Validators.min(1),
  Validators.max(Database.MAX_TEST_INTERVAL_SECONDS / SECONDS_IN_HOUR),
];
export const testIntervalDaysValidators = [
  Validators.min(1),
  Validators.max(Database.MAX_TEST_INTERVAL_SECONDS / SECONDS_IN_DAY),
];
