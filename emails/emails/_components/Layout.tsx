// @ts-nocheck

import {Body, Container, Head, Html, Section, Tailwind} from '@react-email/components';
import * as React from 'react';
import {Fragment, PropsWithChildren} from 'react';
import Logo from './Logo';

export default function (props: PropsWithChildren & {disableLogo?: boolean}) {
  return (
    <Html lang="de">
      <Tailwind>
        {/* Adding the head element automatically adds <meta content="text/html; charset=UTF-8" http-equiv="Content-Type"> */}
        <Head>
          <title th:text="${metaTitle} ? ${metaTitle} : 'poweruptime email'"></title>
        </Head>
        {/*
          Fragment required to prevent issue about "Each child in a list should have a unique key prop"
          REF: https://github.com/resend/react-email/issues/1150#issuecomment-1973529988
        */}
        <Fragment>
          <Body className="mx-auto my-auto bg-white px-2 font-sans dark:bg-black">
            <Container className="mx-auto my-[40px] max-w-[465px] rounded-lg border border-solid border-[#eaeaea] p-[20px]">
              {!props.disableLogo && (
                <Section className="mt-[32px]">
                  <Logo />
                </Section>
              )}
              {...Array.isArray(props.children) ? props.children : [props.children]}
            </Container>
          </Body>
        </Fragment>
      </Tailwind>
    </Html>
  );
}

export const CALL_TO_ACTION =
  'bg-black dark:bg-white rounded text-white dark:text-black text-[12px] font-semibold no-underline text-center px-5 py-3 cursor-pointer';
export const SECONDARY_BUTTON =
  'border border-solid border-black dark:border-white rounded text-black dark:text-white text-[12px] font-medium no-underline text-center px-5 py-3 cursor-pointer';
export const FOOTER_TEXT = 'text-[#666666] dark:text-[#BBBBBB] text-[12px] leading-[24px]';
export const FOOTER_INTENDED_RECIPIENT = 'text-black dark:text-white';
