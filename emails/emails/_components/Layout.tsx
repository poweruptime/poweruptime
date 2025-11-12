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
      </Tailwind>
    </Html>
  );
}

export const CALL_TO_ACTION =
  'bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3 cursor-pointer';
export const SECONDARY_BUTTON =
  'border border-solid border-black dark:border-white rounded text-black dark:text-white text-[12px] font-medium no-underline text-center px-5 py-3 cursor-pointer';
export const FOOTER_TEXT = 'text-black text-[12px] leading-[24px]';
export const FOOTER_INTENDED_RECIPIENT = 'text-black';
