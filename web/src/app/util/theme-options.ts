import {Theme} from '@angularui/theme';

/**
 * i(bootstrapLaptop)
 * i(bootstrapSunFill)
 * i(bootstrapMoonStarsFill)
 */
export const themeOptions = [
  {
    value: 'system',
    viewValue: 'System/Default',
    icon: 'bootstrapLaptop',
  },
  {
    value: 'light',
    viewValue: 'Light',
    icon: 'bootstrapSunFill',
  },
  {
    value: 'dark',
    viewValue: 'Dark',
    icon: 'bootstrapMoonStarsFill',
  },
] satisfies {value: Theme; viewValue: string; icon: string}[];
