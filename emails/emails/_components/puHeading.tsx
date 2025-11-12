import {PropsWithChildren} from 'react';
import * as React from 'react';

export default function (props: PropsWithChildren) {
  return (
    <h1 className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
      {...Array.isArray(props.children) ? props.children : [props.children]}
    </h1>
  );
}
