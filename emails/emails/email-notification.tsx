// @ts-nocheck

import * as React from 'react';
import Layout from './_components/Layout';
import PuText from './_components/puText';

export const EmailNotification = () => {
  return (
    <Layout disableLogo={true}>
      <PuText>
        <span th:text="${body}">Body</span>
      </PuText>
    </Layout>
  );
};

export default EmailNotification;
