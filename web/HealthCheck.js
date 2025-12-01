#!/usr/bin/env node

// healthcheck.js
// Exit 0 if GET / responds 2xx, else exit 1.

const url = 'http://0.0.0.0:4200';
const timeoutMs = 10_000;
const controller = new AbortController();

// Abort the request after timeoutMs
setTimeout(() => controller.abort(), timeoutMs);

fetch(url, {signal: controller.signal})
  .then((res) => {
    process.exit(res.ok ? 0 : 1);
  })
  .catch(() => {
    process.exit(1);
  });
