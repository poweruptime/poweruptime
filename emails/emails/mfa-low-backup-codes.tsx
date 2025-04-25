// @ts-nocheck

import {Link, Text} from '@react-email/components';
import * as React from 'react';
import Layout, {FOOTER_INTENDED_RECIPIENT, FOOTER_TEXT} from './_components/Layout';
import PuHeading from './_components/puHeading';
import PuText from './_components/puText';
import PuHr from './_components/puHr';

export const MFALowBackupCodes = () => {
  return (
    <Layout>
      <PuHeading>Urgent: Backup Codes Running Low</PuHeading>
      <PuText>
        Hello <span th:text="${name}">Placeholder name</span>,
      </PuText>
      <PuText>
        We are notifying you that your backup codes for MFA are running low. You currently have only{' '}
        <u>
          <b th:text="${backupCodesCount}">3</b>
        </u>{' '}
        backup codes remaining.
      </PuText>
      <PuText>
        If you have lost access to your MFA secret, please reactivate your MFA setup on{' '}
        <Link
          href="http://localhost:4200/profile/security"
          th:href="@{{host}/profile/security(host=${urlHost})}"
          className="text-blue-600 no-underline">
          your account settings
        </Link>
        .
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

export default MFALowBackupCodes;
