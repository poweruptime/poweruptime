// @ts-nocheck

import {Button, Link, Section, Text} from '@react-email/components';
import * as React from 'react';
import Layout, {CALL_TO_ACTION, FOOTER_INTENDED_RECIPIENT, FOOTER_TEXT} from './_components/Layout';
import PuHeading from './_components/puHeading';
import PuText from './_components/puText';
import PuHr from './_components/puHr';

export const SetupTest = () => {
  return (
    <Layout>
      <PuHeading>
        <strong>poweruptime</strong> email setup test
      </PuHeading>
      <PuText>Test email successfully delivered.</PuText>
      <Section className="mt-[32px] mb-[32px] text-center">
        <Button
          className={CALL_TO_ACTION}
          th:href="@{{host}/setup?email={email}&code={code}(host=${urlHost}, email=${inviteeEmail}, code=${code})}">
          Complete setup
        </Button>
      </Section>
      <PuText>
        or copy and paste this URL into your browser:
        <br />
        <Link
          className="text-blue-600 no-underline"
          th:href="@{{host}/setup?email={email}&code={code}(host=${urlHost}, email=${inviteeEmail}, code=${code})}"
          th:text="@{{host}/setup?email={email}&code={code}(host=${urlHost}, email=${inviteeEmail}, code=${code})}">
          Placeholder link name
        </Link>
      </PuText>
      <PuHr />
      <Text className={FOOTER_TEXT}>
        This email was intended for{' '}
        <span th:text="${inviteeEmail}" className={FOOTER_INTENDED_RECIPIENT}>
          Placeholder invitee email
        </span>
        .
        <br />
        If you were not expecting this, you can ignore this email.
      </Text>
    </Layout>
  );
};

export default SetupTest;
