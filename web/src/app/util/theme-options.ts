import {Theme} from '@angularui/theme';
import {BiName} from 'dfx-bootstrap-icons';

export const themeOptions = [
  {
    value: 'system',
    viewValue: 'System/Default',
    icon: 'laptop',
  },
  {
    value: 'light',
    viewValue: 'Light',
    icon: 'sun-fill',
  },
  {
    value: 'dark',
    viewValue: 'Dark',
    icon: 'moon-stars-fill',
  },
] satisfies {value: Theme; viewValue: string; icon: BiName}[];
