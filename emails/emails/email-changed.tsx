// @ts-nocheck

import {Text} from '@react-email/components';
import * as React from 'react';
import Layout, {FOOTER_INTENDED_RECIPIENT, FOOTER_TEXT} from './_components/Layout';
import PuHeading from './_components/puHeading';
import PuText from './_components/puText';
import PuHr from './_components/puHr';

export const EmailChanged = () => {
  return (
    <Layout>
      <PuHeading>Email updated</PuHeading>
      <PuText>
        Hello <span th:text="${name}">Placeholder name</span>,
      </PuText>
      <PuText>
        The email address associated with your <strong>poweruptime</strong> account has been
        successfully updated to this email address.
      </PuText>
      <PuHr />
      <Text className={FOOTER_TEXT}>
        This notification was sent to{' '}
        <span th:text="${email}" className={FOOTER_INTENDED_RECIPIENT}>
          Placeholder email
        </span>
        .
      </Text>
    </Layout>
  );
};

export default EmailChanged;
