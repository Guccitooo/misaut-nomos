import React from 'react';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import App from './App';
import { seedPublicQueries } from './lib/publicPageData';

// Build-time rendering uses the exact application tree and CSS classes that
// hydrate in the browser. Waiting for onAllReady resolves lazy routes without
// emitting a second layout, a loading overlay or client-only SEO text.
export async function renderPublicPage(pathname, data) {
  globalThis.__MIS_PUBLIC_PAGE_DATA__ = data;
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 300000, retry: false } } });
  seedPublicQueries(queryClient, data);
  try {
    return await new Promise((resolve, reject) => {
      const output = new PassThrough();
      let html = '';
      let failed = false;
      output.on('data', (chunk) => { html += chunk.toString(); });
      output.on('end', () => { if (!failed) resolve(html); });
      output.on('error', reject);
      const stream = renderToPipeableStream(
        <App RouterComponent={StaticRouter} routerProps={{ location: pathname }} queryClient={queryClient} />,
        {
          onAllReady() { if (!failed) stream.pipe(output); },
          onError(error) { failed = true; reject(error); },
          onShellError(error) { failed = true; reject(error); },
        },
      );
    });
  } finally {
    queryClient.clear();
    delete globalThis.__MIS_PUBLIC_PAGE_DATA__;
  }
}
