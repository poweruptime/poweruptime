import {PropsWithChildren} from 'react';
import {Text} from '@react-email/components';
import * as React from 'react';

export default function (props: PropsWithChildren) {
  return (
    <Text className="text-[14px] leading-[24px] text-black">
      {...Array.isArray(props.children) ? props.children : [props.children]}
    </Text>
  );
}
