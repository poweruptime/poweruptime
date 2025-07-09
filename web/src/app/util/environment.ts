import {environment as injectedEnvironment} from '../../environments/environment';

function getChannel() {
  if (injectedEnvironment.production) {
    if (injectedEnvironment.version.includes('beta')) {
      return 'beta';
    }

    return 'production';
  }

  return 'dev';
}

const channel: ReturnType<typeof getChannel> = getChannel();

export const environment: {
  channel: typeof channel;
  isBetaOrDevChannel: boolean;
} & typeof injectedEnvironment = {
  ...injectedEnvironment,
  channel,
  isBetaOrDevChannel: channel !== 'production',
};
