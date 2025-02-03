// @ts-nocheck

import {Text} from '@react-email/components';
import * as React from 'react';
import Layout, {CALL_TO_ACTION, FOOTER_INTENDED_RECIPIENT, FOOTER_TEXT} from './_components/Layout';
import PuHeading from './_components/puHeading';
import PuText from './_components/puText';
import PuHr from './_components/puHr';

export const PasswordChanged = () => {
  return (
    <Layout>
      <PuHeading>Password updated</PuHeading>
      <PuText>
        Hello <span th:text="${name}">Placeholder name</span>,
      </PuText>
      <PuText>
        Your password was successfully updated on <strong>poweruptime</strong>. If you made this
        change, no further action is needed.
      </PuText>
      <PuHr />
      <Text className={FOOTER_TEXT}>
        This notification was sent to{' '}
        <span th:text="${email}" className={FOOTER_INTENDED_RECIPIENT}>
          Placeholder email
        </span>
        .
        <br />
        If you were not expecting this password change, contact your instance administrator
        immediately.
      </Text>
    </Layout>
  );
};

export default PasswordChanged;
