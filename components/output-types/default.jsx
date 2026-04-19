'use strict';

import React from 'react';

function DefaultLayout({
  children,
  contextPath,
  deployment,
  CssLinks,
  Fusion,
  Libs,
  MetaTags,
}) {
  return (
    <html>
      <head>
        <title>Fusion Article</title>
        <MetaTags />
        <Libs />
        <CssLinks />
        <link
          rel="icon"
          type="image/x-icon"
          href={deployment(`${contextPath}/resources/favicon.ico`)}
        />
      </head>

      <body>
        <div id="fusion-app">{children}</div>
        <Fusion />
      </body>
    </html>
  );
}

DefaultLayout.displayName = 'DefaultLayout';

export default DefaultLayout;
