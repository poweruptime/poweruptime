// @ts-nocheck

import * as React from 'react';

export default function () {
  return (
    <img
      alt="poweruptime Logo"
      width="124"
      height="126"
      className="mx-auto my-0 block rounded-md"
      src="../static/logo.png"
      th:src="@{{host}/api/v1/public/static-files/logo.png(host=${urlHost})}"
    />
  );
}
