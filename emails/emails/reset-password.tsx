// @ts-nocheck

import {Button, Link, Section, Text} from '@react-email/components';
import * as React from 'react';
import Layout, {CALL_TO_ACTION, FOOTER_INTENDED_RECIPIENT, FOOTER_TEXT} from './_components/Layout';
import PuHeading from './_components/puHeading';
import PuText from './_components/puText';
import PuHr from './_components/puHr';

export const ResetPassword = () => {
  return (
    <Layout>
      <PuHeading>
        Password reset for <strong>poweruptime</strong>
      </PuHeading>
      <PuText>
        Hello <span th:text="${name}">Placeholder name</span>,
      </PuText>
      <PuText>
        you've requested a password reset for <strong>poweruptime.</strong>
      </PuText>
      <Section className="mb-[32px] mt-[32px] text-center">
        <Button
          className={CALL_TO_ACTION}
          th:href="@{{host}/login/forgot-password?email={email}&resetToken={resetToken}(host=${urlHost}, email=${email}, resetToken=${resetToken})}">
          Reset password
        </Button>
      </Section>
      <PuText>
        or copy and paste this URL into your browser:
        <br />
        <Link
          className="text-blue-600 no-underline"
          th:href="@{{host}/login/forgot-password?email={email}&resetToken={resetToken}(host=${urlHost}, email=${email}, resetToken=${resetToken})}"
          th:text="@{{host}/login/forgot-password?email={email}&resetToken={resetToken}(host=${urlHost}, email=${email}, resetToken=${resetToken})}">
          Placeholder link name
        </Link>
      </PuText>
      <PuHr />
      <Text className={FOOTER_TEXT}>
        This password reset was intended for{' '}
        <span th:text="${email}" className={FOOTER_INTENDED_RECIPIENT}>
          Placeholder email
        </span>
        .
        <br />
        If you were not expecting this, you can ignore this email.
      </Text>
    </Layout>
  );
};

export default ResetPassword;
