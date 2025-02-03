import { PropsWithChildren } from "react";
import * as React from "react";

export default function (props: PropsWithChildren) {
  return (
    <h1 className="text-black dark:text-white text-[24px] font-normal text-center p-0 my-[30px] mx-0">
      {...Array.isArray(props.children) ? props.children : [props.children]}
    </h1>
  );
}
