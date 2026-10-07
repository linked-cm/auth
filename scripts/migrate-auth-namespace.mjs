#!/usr/bin/env node

import { FusekiStore } from '@_linked/fuseki/shapes/FusekiStore';
import {
  AUTH_NAMESPACE,
  LEGACY_AUTH_NAMESPACE,
  migrateAuthNamespace,
} from '../lib/esm/utils/migrateNamespace.js';

const usage = `Usage:
  npm run migrate:namespace -- --dry-run
  npm run migrate:namespace -- --apply

Required environment variables:
  FUSEKI_URL       Full dataset endpoint, for example http://localhost:3030/pg-test
  FUSEKI_USER      Fuseki username
  FUSEKI_PASSWORD  Fuseki password

The command never selects a dataset implicitly. Back up the dataset and stop application writes
before using --apply.`;

function fail(message) {
  console.error(`@_linked/auth migration: ${message}\n\n${usage}`);
  process.exitCode = 1;
}

function parseMode(args) {
  if (args.includes('--help') || args.includes('-h')) return 'help';

  const known = new Set(['--dry-run', '--apply']);
  const unknown = args.filter((arg) => !known.has(arg));
  if (unknown.length) throw new Error(`unknown argument${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}`);

  const selected = args.filter((arg) => known.has(arg));
  if (selected.length !== 1) {
    throw new Error('choose exactly one mode: --dry-run or --apply');
  }
  return selected[0] === '--apply' ? 'apply' : 'dry-run';
}

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function datasetEndpoint(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('FUSEKI_URL must be a valid URL');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('FUSEKI_URL must use http or https');
  }
  if (url.username || url.password) {
    throw new Error('do not put credentials in FUSEKI_URL; use FUSEKI_USER and FUSEKI_PASSWORD');
  }
  if (url.search || url.hash) {
    throw new Error('FUSEKI_URL must not contain a query string or fragment');
  }

  const path = url.pathname.replace(/\/+$/, '');
  if (!path || path === '/' || path.startsWith('/$/')) {
    throw new Error('FUSEKI_URL must identify a dataset, not the Fuseki server or admin API');
  }
  url.pathname = path;
  return url.toString().replace(/\/$/, '');
}

async function main() {
  let mode;
  try {
    mode = parseMode(process.argv.slice(2));
    if (mode === 'help') {
      console.log(usage);
      return;
    }

    const endpoint = datasetEndpoint(requiredEnvironment('FUSEKI_URL'));
    const username = requiredEnvironment('FUSEKI_USER');
    const password = requiredEnvironment('FUSEKI_PASSWORD');
    const dryRun = mode === 'dry-run';

    console.log(`Auth namespace migration (${mode})`);
    console.log(`Dataset: ${endpoint}`);
    console.log(`Rewrite: ${LEGACY_AUTH_NAMESPACE} -> ${AUTH_NAMESPACE}`);
    if (!dryRun) {
      console.log('Applying migration. The operator is responsible for the verified backup and write pause.');
    }

    const store = new FusekiStore({ endpoint, credentials: { username, password } });
    const result = await migrateAuthNamespace(store, { dryRun });
    console.log(JSON.stringify(result));

    if (!dryRun && result.after !== 0) {
      throw new Error(`migration finished with ${result.after} legacy triples still present`);
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

await main();
