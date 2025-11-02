// @ts-nocheck

import {Button, Link, Section, Text} from '@react-email/components';
import * as React from 'react';
import Layout, {CALL_TO_ACTION, FOOTER_INTENDED_RECIPIENT, FOOTER_TEXT} from './_components/Layout';
import PuHeading from './_components/puHeading';
import PuText from './_components/puText';
import PuHr from './_components/puHr';

export const EmailChangeNew = () => {
  return (
    <Layout>
      <PuHeading>Email change requested</PuHeading>
      <PuText>
        Hello <span th:text="${name}">Placeholder name</span>,
      </PuText>
      <PuText>
        You are trying to change your email address for your <strong>poweruptime</strong> account.
      </PuText>
      <PuText>Press the following button to confirm this email address.</PuText>
      <Section className="mt-[32px] mb-[32px] text-center">
        <Button
          className={CALL_TO_ACTION}
          th:href="@{{host}/email-change/confirm/{confirmToken}(host=${urlHost}, confirmToken=${confirmToken})}">
          Confirm
        </Button>
      </Section>
      <PuText>
        or copy and paste this URL into your browser:
        <br />
        <Link
          className="text-blue-600 no-underline"
          th:href="@{{host}/email-change/confirm/{confirmToken}(host=${urlHost}, confirmToken=${confirmToken})}"
          th:text="@{{host}/email-change/confirm/{confirmToken}(host=${urlHost}, confirmToken=${confirmToken})}">
          Placeholder link name
        </Link>
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

export default EmailChangeNew;
