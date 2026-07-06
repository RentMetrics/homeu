#!/usr/bin/env node
/**
 * Scan all MonthlyTimeSeries Excel files and populate:
 * - pmCompanyName (col W: Management)
 * - pmPhone (col I: Phone)
 * - propertyOwner (col V: Property Owner)
 * - lastRenovated (col U: Last Renovation)
 *
 * Reads the "Property Attributes" sheet from each file.
 * Headers are on row index 3 (rows 0-2 are title/date/category).
 */
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import XLSX from 'xlsx';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'data', 'market-data', 'Jan_2026');

// Read .env.local for CONVEX_URL
const envFile = readFileSync(join(PROJECT_ROOT, '.env.local'), 'utf8');
const convexUrlMatch = envFile.match(/NEXT_PUBLIC_CONVEX_URL=(.+)/);
if (!convexUrlMatch) {
  console.error('Could not find NEXT_PUBLIC_CONVEX_URL in .env.local');
  process.exit(1);
}
const CONVEX_URL = convexUrlMatch[1].trim();

const { ConvexHttpClient } = await import('convex/browser');
const { api } = await import('../convex/_generated/api.js');

const client = new ConvexHttpClient(CONVEX_URL);

// Get all Excel files (skip temp files starting with ~$)
const files = readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'))
  .sort();

console.log(`Found ${files.length} Excel files to scan`);

let totalUpdates = 0;
let totalUpdated = 0;
let totalNotFound = 0;
let filesProcessed = 0;

for (const file of files) {
  const filePath = join(DATA_DIR, file);

  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets['Property Attributes'];
    if (!sheet) {
      console.warn(`  [SKIP] ${file}: No "Property Attributes" sheet`);
      continue;
    }

    // Parse all rows as array of arrays
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Headers are at row index 3
    const headers = rows[3];
    if (!headers) {
      console.warn(`  [SKIP] ${file}: No header row at index 3`);
      continue;
    }

    // Find column indices
    const colMap = {};
    for (let i = 0; i < headers.length; i++) {
      const h = String(headers[i] || '').trim();
      if (h === 'Property ID') colMap.propertyId = i;
      if (h === 'Phone') colMap.phone = i;
      if (h === 'Year Built') colMap.yearBuilt = i;
      if (h === 'Last Renovation') colMap.lastRenovated = i;
      if (h === 'Property Owner') colMap.propertyOwner = i;
      if (h === 'Management') colMap.management = i;
    }

    if (colMap.propertyId === undefined) {
      console.warn(`  [SKIP] ${file}: No "Property ID" column found`);
      continue;
    }

    // Extract data rows (start at index 4)
    const updates = [];
    for (let r = 4; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[colMap.propertyId]) continue;

      const propertyId = String(row[colMap.propertyId]).trim();
      if (!propertyId) continue;

      const update = { propertyId };

      if (colMap.management !== undefined && row[colMap.management]) {
        update.pmCompanyName = String(row[colMap.management]).trim();
      }
      if (colMap.phone !== undefined && row[colMap.phone]) {
        update.pmPhone = String(row[colMap.phone]).trim();
      }
      if (colMap.propertyOwner !== undefined && row[colMap.propertyOwner]) {
        update.propertyOwner = String(row[colMap.propertyOwner]).trim();
      }
      if (colMap.lastRenovated !== undefined && row[colMap.lastRenovated]) {
        const val = Number(row[colMap.lastRenovated]);
        if (!isNaN(val) && val > 1900 && val <= 2030) {
          update.lastRenovated = val;
        }
      }

      // Only include if we have at least one enrichment field
      if (update.pmCompanyName || update.pmPhone || update.propertyOwner || update.lastRenovated) {
        updates.push(update);
      }
    }

    if (updates.length === 0) {
      filesProcessed++;
      continue;
    }

    totalUpdates += updates.length;

    // Send in batches of 50 (keep mutation payloads reasonable)
    const BATCH_SIZE = 50;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      try {
        const result = await client.mutation(api.multifamilyproperties.bulkUpdateEnrichment, {
          updates: batch,
        });
        totalUpdated += result.updated;
        totalNotFound += result.notFound;
      } catch (err) {
        console.error(`  [ERROR] ${file} batch ${Math.floor(i/BATCH_SIZE)+1}: ${err.message}`);
      }
    }

    filesProcessed++;
    if (filesProcessed % 25 === 0) {
      console.log(`  Progress: ${filesProcessed}/${files.length} files, ${totalUpdated} properties updated`);
    }
  } catch (err) {
    console.error(`  [ERROR] ${file}: ${err.message}`);
  }
}

console.log('\n═══ ENRICHMENT COMPLETE ═══');
console.log(`Files processed: ${filesProcessed}/${files.length}`);
console.log(`Properties with enrichment data: ${totalUpdates}`);
console.log(`Successfully updated: ${totalUpdated}`);
console.log(`Not found in DB: ${totalNotFound}`);
