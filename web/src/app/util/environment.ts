import {environment as injectedEnvironment} from '../../environments/environment';

function getChannel() {
  if (injectedEnvironment.production) {
    if (injectedEnvironment.version.includes('beta')) {
      return 'beta' as const;
    }

    return 'production' as const;
  }

  return 'dev' as const;
}

const channel = getChannel();

export const environment = {
  ...injectedEnvironment,
  channel,
  isBetaOrDevChannel: channel !== 'production',
};
