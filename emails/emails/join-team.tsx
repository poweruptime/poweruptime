// @ts-nocheck

import {Button, Link, Section, Text} from 'react-email';
import * as React from 'react';
import Layout, {CALL_TO_ACTION, FOOTER_INTENDED_RECIPIENT, FOOTER_TEXT} from './_components/Layout';
import PuHeading from './_components/puHeading';
import PuText from './_components/puText';
import PuHr from './_components/puHr';

export const JoinTeam = () => {
  return (
    <Layout>
      <PuHeading>
        Join <strong th:text="${inviterTeam}">Placeholder inviter team</strong> on{' '}
        <strong>poweruptime</strong>
      </PuHeading>
      <PuText>
        Hello <span th:text="${inviteeName}">Placeholder invitee name</span>,
      </PuText>
      <PuText>
        <strong th:text="${inviterName}">Placeholder invitee name</strong> (
        <Link
          th:href="@{mailto:{inviterEmail}(inviterEmail=${inviterEmail})}"
          th:text="${inviterEmail}"
          className="text-blue-600 no-underline">
          Placeholder inviterEmail
        </Link>
        ) has invited you to the <strong th:text="${inviterTeam}">Placeholder Team</strong> team on{' '}
        <strong>poweruptime</strong>.
      </PuText>
      <Section className="mt-[32px] mb-[32px] text-center">
        <Button
          className={CALL_TO_ACTION}
          th:href="@{{host}/t/join/{token}(host=${urlHost}, token=${token})}">
          Join the team
        </Button>
      </Section>
      <PuText>
        or copy and paste this URL into your browser:
        <br />
        <Link
          className="text-blue-600 no-underline"
          th:href="@{{host}/t/join/{token}(host=${urlHost}, token=${token})}"
          th:text="@{{host}/t/join/{token}(host=${host}, token=${token})}">
          Placeholder link name
        </Link>
      </PuText>
      <PuHr />
      <Text className={FOOTER_TEXT}>
        This invitation was intended for{' '}
        <span th:text="${inviteeEmail}" className={FOOTER_INTENDED_RECIPIENT}>
          Placeholder invitee email
        </span>
        .
        <br />
        If you were not expecting this invitation, you can ignore this email.
      </Text>
    </Layout>
  );
};

export default JoinTeam;
