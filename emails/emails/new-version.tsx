// @ts-nocheck

import {Section, Button, Link} from '@react-email/components';
import * as React from 'react';
import Layout, {CALL_TO_ACTION, SECONDARY_BUTTON} from './_components/Layout';
import PuHeading from './_components/puHeading';
import PuText from './_components/puText';

export const NewVersion = () => {
  return (
    <Layout>
      <PuHeading>New version</PuHeading>
      <PuText>
        Hi! poweruptime version <b th:text="${latestVersion}">99.99.99</b> is available.
      </PuText>
      <Section className="mb-[32px] mt-[32px] text-center">
        <Button className={CALL_TO_ACTION} th:href="@{{host}/settings/overview(host=${urlHost})}">
          Check the dashboard
        </Button>
        <Button
          className={SECONDARY_BUTTON + ' mx-4 mt-4'}
          href="https://github.com/poweruptime/poweruptime/blob/main/changelogs/CHANGELOG.md">
          View the Changelog
        </Button>
      </Section>
      <PuText>
        or copy and paste this URL into your browser:
        <br />
        <Link
          className="text-blue-600 no-underline"
          th:href="@{{host}/settings/overview(host=${urlHost})}"
          th:text="@{{host}/settings/overview(host=${urlHost})}">
          http://localhost:4200/settings/overview
        </Link>
      </PuText>
    </Layout>
  );
};

export default NewVersion;
