#!/usr/bin/env node
/**
 * Import properties from JSONL via bulkUpsertProperties mutation.
 * This preserves existing Google enrichment data by upserting.
 */
import { readFileSync } from 'fs';
import { resolve, join } from 'path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const JSONL_FILE = join(PROJECT_ROOT, 'data', 'market-data', 'jsonl', 'properties.jsonl');

// Read .env.local for CONVEX_URL
const envFile = readFileSync(join(PROJECT_ROOT, '.env.local'), 'utf8');
const convexUrlMatch = envFile.match(/NEXT_PUBLIC_CONVEX_URL=(.+)/);
if (!convexUrlMatch) {
  console.error('Could not find NEXT_PUBLIC_CONVEX_URL in .env.local');
  process.exit(1);
}
const CONVEX_URL = convexUrlMatch[1].trim();

// Dynamic import of convex client
const { ConvexHttpClient } = await import('convex/browser');
const { api } = await import('../convex/_generated/api.js');

const client = new ConvexHttpClient(CONVEX_URL);

// Read all properties from JSONL
const lines = readFileSync(JSONL_FILE, 'utf8').split('\n').filter(l => l.trim());
console.log(`Loaded ${lines.length} properties from JSONL`);

const properties = lines.map(line => {
  const p = JSON.parse(line);
  // Only include fields the mutation expects
  return {
    propertyId: p.propertyId,
    propertyName: p.propertyName,
    address: p.address,
    city: p.city,
    state: p.state,
    zipCode: p.zipCode,
    totalUnits: p.totalUnits,
    yearBuilt: p.yearBuilt,
    averageUnitSize: p.averageUnitSize,
  };
});

// Batch in groups of 100 (Convex mutation payload limits)
const BATCH_SIZE = 100;
let totalInserted = 0;
let totalUpdated = 0;

for (let i = 0; i < properties.length; i += BATCH_SIZE) {
  const batch = properties.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(properties.length / BATCH_SIZE);

  try {
    const result = await client.mutation(api.multifamilyproperties.bulkUpsertProperties, {
      properties: batch,
    });
    totalInserted += result.inserted;
    totalUpdated += result.updated;
    process.stdout.write(`\r  Batch ${batchNum}/${totalBatches} — Inserted: ${totalInserted}, Updated: ${totalUpdated}`);
  } catch (err) {
    console.error(`\n  Error on batch ${batchNum}: ${err.message}`);
  }
}

console.log('\n');
console.log('════════════════════════════════════════');
console.log('  Property Import Complete');
console.log('════════════════════════════════════════');
console.log(`  Total inserted: ${totalInserted}`);
console.log(`  Total updated:  ${totalUpdated}`);
console.log(`  Total records:  ${properties.length}`);
console.log('════════════════════════════════════════');
