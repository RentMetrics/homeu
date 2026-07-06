#!/usr/bin/env node
/**
 * HomeU Market Data Import — Full Historical Import
 *
 * Parses CoStar MonthlyTimeSeries XLSX files and extracts ALL historical
 * monthly data (Jan 2009 → Jan 2026) for rent, occupancy, and concessions.
 *
 * Phase 1: Parse XLSX → write JSONL files (streamed, low memory)
 * Phase 2: Import properties via Convex mutations (upserts)
 * Phase 3: Import market data via `npx convex import --table --append`
 *
 * Usage:
 *   node data/import-market-data.mjs                    # Full run
 *   node data/import-market-data.mjs --parse-only       # Only generate JSONL files
 *   node data/import-market-data.mjs --import-only      # Only import existing JSONL files
 *   node data/import-market-data.mjs --limit 5          # Process first 5 files
 *   node data/import-market-data.mjs --file Dallas      # Only files matching pattern
 */

import { readdir, writeFile } from 'fs/promises';
import { readFileSync, createWriteStream, existsSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';
import XLSX from 'xlsx';

// ─── Config ───────────────────────────────────────────────────────
const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'data', 'market-data', 'Jan_2026');
const OUTPUT_DIR = join(PROJECT_ROOT, 'data', 'market-data', 'jsonl');

// ─── CLI Args ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
const PARSE_ONLY = args.includes('--parse-only');
const IMPORT_ONLY = args.includes('--import-only');
const limitIdx = args.indexOf('--limit');
const FILE_LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 0;
const fileIdx = args.indexOf('--file');
const FILE_PATTERN = fileIdx >= 0 ? args[fileIdx + 1] : '';

// ─── Stats ────────────────────────────────────────────────────────
const stats = {
  filesProcessed: 0,
  filesErrored: 0,
  properties: 0,
  rentRecords: 0,
  occupancyRecords: 0,
  concessionRecords: 0,
};

// ─── Excel Date Helper ────────────────────────────────────────────
function excelSerialToYYYYMM(serial) {
  if (typeof serial !== 'number' || serial < 30000 || serial > 60000) return null;
  // Excel: days since Jan 0, 1900 (with leap year bug at serial 60)
  const date = new Date((serial - 25569) * 86400 * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// ─── Build date column map: col index → "YYYY-MM" ────────────────
function buildDateColumnMap(headerRow, startCol, endCol) {
  const map = new Map(); // colIndex → "YYYY-MM"
  for (let col = startCol; col < endCol; col++) {
    const val = headerRow[col];
    const month = excelSerialToYYYYMM(val);
    if (month) {
      map.set(col, month);
    }
  }
  return map;
}

// ─── Find section columns in header row ───────────────────────────
function findSectionColumns(row) {
  const sections = {};
  for (let col = 0; col < (row?.length || 0); col++) {
    const val = String(row[col] || '').trim();
    if (val) sections[val] = col;
  }
  return sections;
}

// ─── Parse Property Attributes ────────────────────────────────────
function parsePropertyAttributes(workbook) {
  const sheet = workbook.Sheets['Property Attributes'];
  if (!sheet) return [];

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (data.length < 5) return [];

  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    if (data[i] && String(data[i][0]).trim() === 'Property ID') {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx < 0) return [];

  const headers = data[headerRowIdx].map(h => String(h || '').trim());
  const col = name => headers.indexOf(name);

  const properties = [];
  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[col('Property ID')]) continue;

    const propertyId = String(row[col('Property ID')]).trim();
    const totalUnits = parseInt(row[col('Total Units')]) || 0;
    if (!propertyId || totalUnits <= 0) continue;

    properties.push({
      propertyId,
      propertyName: String(row[col('Name')] || propertyId).trim(),
      address: String(row[col('Address')] || '').trim(),
      city: String(row[col('City')] || '').trim(),
      state: String(row[col('State')] || '').trim(),
      zipCode: String(row[col('ZIP Code')] || '').trim(),
      totalUnits,
      yearBuilt: parseInt(row[col('Year Built')]) || 0,
      averageUnitSize: Math.round(parseFloat(row[col('Average Unit Size')]) || 0),
    });
  }
  return properties;
}

// ─── Parse ALL months from Rents Sheet ────────────────────────────
function parseAllRents(workbook, propertyMap) {
  const sheet = workbook.Sheets['Rents'];
  if (!sheet) return [];

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (data.length < 5) return [];

  // Find section header row ("Effective Rent", "Effective RPSF", "Asking Rent")
  let sectionRow = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      if (String(row[c] || '').trim() === 'Effective Rent') {
        sectionRow = i;
        break;
      }
    }
    if (sectionRow >= 0) break;
  }
  if (sectionRow < 0) return [];

  const subHeaderRow = sectionRow + 1;
  const headerRow = data[subHeaderRow];
  if (!headerRow) return [];

  // Identify sections
  const sections = findSectionColumns(data[sectionRow]);
  const effRentStart = sections['Effective Rent'] ?? -1;
  const effRPSFStart = sections['Effective RPSF'] ?? headerRow.length;
  const askingRentStart = sections['Asking Rent'] ?? headerRow.length;

  if (effRentStart < 0) return [];

  // Build date maps for each section
  const effRentDates = buildDateColumnMap(headerRow, effRentStart, effRPSFStart);
  const effRPSFDates = buildDateColumnMap(headerRow, effRPSFStart, askingRentStart);
  const askingRentDates = buildDateColumnMap(headerRow, askingRentStart, headerRow.length);

  // Build RPSF and asking rent lookup by month for quick access
  const rpsfByMonth = new Map();
  for (const [colIdx, month] of effRPSFDates) {
    rpsfByMonth.set(month, colIdx);
  }
  const askingByMonth = new Map();
  for (const [colIdx, month] of askingRentDates) {
    askingByMonth.set(month, colIdx);
  }

  // Find Property ID column
  let propIdCol = 0;
  for (let c = 0; c < headerRow.length; c++) {
    if (String(headerRow[c] || '').trim() === 'Property ID') {
      propIdCol = c;
      break;
    }
  }

  const records = [];
  const now = Date.now();

  for (let i = subHeaderRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const propertyId = String(row[propIdCol] || '').trim();
    if (!propertyId) continue;

    const propInfo = propertyMap.get(propertyId);
    const totalUnits = propInfo?.totalUnits || 0;

    // For each month in Effective Rent
    for (const [colIdx, month] of effRentDates) {
      const effRent = parseFloat(row[colIdx]);
      if (isNaN(effRent) || effRent <= 0) continue;

      const rpsfCol = rpsfByMonth.get(month);
      const askCol = askingByMonth.get(month);
      const rpsf = rpsfCol !== undefined ? (parseFloat(row[rpsfCol]) || 0) : 0;
      const asking = askCol !== undefined ? (parseFloat(row[askCol]) || 0) : effRent;

      records.push({
        propertyId,
        month,
        averageRent: Math.round(effRent * 100) / 100,
        minRent: Math.round(effRent * 100) / 100,
        maxRent: Math.round((asking || effRent) * 100) / 100,
        rentPerSqFt: Math.round(rpsf * 1000) / 1000,
        totalRevenue: Math.round(effRent * totalUnits * 100) / 100,
        unitsRented: totalUnits,
        totalUnits,
        createdAt: now,
      });
    }
  }
  return records;
}

// ─── Parse ALL months from Occupancy Sheet ────────────────────────
function parseAllOccupancy(workbook, propertyMap) {
  const sheet = workbook.Sheets['Occupancy'];
  if (!sheet) return [];

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (data.length < 5) return [];

  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    if (data[i] && String(data[i][0] || '').trim() === 'Property ID') {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx < 0) return [];

  const headerRow = data[headerRowIdx];
  const headers = headerRow.map(h => String(h || '').trim());
  const propIdCol = headers.indexOf('Property ID');
  const totalUnitsCol = headers.indexOf('Total Units');

  // Build date column map (columns after attribute columns, roughly col 20+)
  const dateCols = buildDateColumnMap(headerRow, 20, headerRow.length);
  if (dateCols.size === 0) return [];

  const records = [];
  const now = Date.now();

  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const propertyId = String(row[propIdCol] || '').trim();
    if (!propertyId) continue;

    const propInfo = propertyMap.get(propertyId);
    const totalUnits = totalUnitsCol >= 0
      ? (parseInt(row[totalUnitsCol]) || 0)
      : (propInfo?.totalUnits || 0);

    for (const [colIdx, month] of dateCols) {
      const occRate = parseFloat(row[colIdx]);
      if (isNaN(occRate) || occRate < 0 || occRate > 1.05) continue;

      const occupiedUnits = Math.round(occRate * totalUnits);
      const vacantUnits = Math.max(0, totalUnits - occupiedUnits);

      records.push({
        propertyId,
        month,
        occupancyRate: Math.round(occRate * 10000) / 100,
        occupiedUnits,
        vacantUnits,
        totalUnits,
        createdAt: now,
      });
    }
  }
  return records;
}

// ─── Parse ALL months from Concessions Sheet ──────────────────────
function parseAllConcessions(workbook, propertyMap) {
  const sheet = workbook.Sheets['Concessions'];
  if (!sheet) return [];

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (data.length < 5) return [];

  // Find section header row containing "Concession"
  let sectionRow = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] || '').trim();
      if (val.includes('Concession') && (val.includes('$') || val.includes('('))) {
        sectionRow = i;
        break;
      }
    }
    if (sectionRow >= 0) break;
  }
  if (sectionRow < 0) return [];

  const subHeaderRow = sectionRow + 1;
  const headerRow = data[subHeaderRow];
  if (!headerRow) return [];

  // Find the $ concession section
  const sections = findSectionColumns(data[sectionRow]);
  let dollarStart = -1;
  let dollarEnd = headerRow.length;

  for (const [key, colIdx] of Object.entries(sections)) {
    if (key.includes('$') || (key.includes('Concession') && !key.includes('%'))) {
      dollarStart = colIdx;
    }
    if (key.includes('%')) {
      dollarEnd = colIdx;
    }
  }

  if (dollarStart < 0) {
    const concKeys = Object.keys(sections).filter(k => k.includes('Concession'));
    if (concKeys.length > 0) {
      dollarStart = sections[concKeys[0]];
      if (concKeys.length > 1) dollarEnd = sections[concKeys[1]];
    }
  }
  if (dollarStart < 0) return [];

  const dateCols = buildDateColumnMap(headerRow, dollarStart, dollarEnd);
  if (dateCols.size === 0) return [];

  // Find Property ID column
  let propIdCol = 0;
  for (let c = 0; c < headerRow.length; c++) {
    if (String(headerRow[c] || '').trim() === 'Property ID') {
      propIdCol = c;
      break;
    }
  }

  const records = [];
  const now = Date.now();

  for (let i = subHeaderRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const propertyId = String(row[propIdCol] || '').trim();
    if (!propertyId) continue;

    const propInfo = propertyMap.get(propertyId);
    const totalUnits = propInfo?.totalUnits || 0;

    for (const [colIdx, month] of dateCols) {
      const amt = parseFloat(row[colIdx]);
      if (isNaN(amt) || amt <= 0) continue;

      records.push({
        propertyId,
        month,
        concessionType: 'Market Concession',
        concessionAmount: Math.round(amt * 100) / 100,
        concessionDuration: 1,
        unitsWithConcessions: 0,
        totalUnits,
        createdAt: now,
      });
    }
  }
  return records;
}

// ─── JSONL Writer ─────────────────────────────────────────────────
function appendJsonl(stream, records) {
  for (const rec of records) {
    stream.write(JSON.stringify(rec) + '\n');
  }
}

// ─── Phase 1: Parse XLSX → JSONL ─────────────────────────────────
async function parsePhase() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  Phase 1: Parse XLSX files → JSONL');
  console.log('══════════════════════════════════════════════════════════\n');

  // Create output dir
  execSync(`mkdir -p "${OUTPUT_DIR}"`);

  // List XLSX files
  let files = (await readdir(DATA_DIR))
    .filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'))
    .sort();

  if (FILE_PATTERN) {
    files = files.filter(f => f.toLowerCase().includes(FILE_PATTERN.toLowerCase()));
  }
  if (FILE_LIMIT > 0) {
    files = files.slice(0, FILE_LIMIT);
  }

  console.log(`  Found ${files.length} XLSX files\n`);

  // Open JSONL output streams
  const propsStream = createWriteStream(join(OUTPUT_DIR, 'properties.jsonl'));
  const rentStream = createWriteStream(join(OUTPUT_DIR, 'rentData.jsonl'));
  const occStream = createWriteStream(join(OUTPUT_DIR, 'occupancyData.jsonl'));
  const concStream = createWriteStream(join(OUTPUT_DIR, 'concessionData.jsonl'));

  const seenPropertyIds = new Set();

  for (let fi = 0; fi < files.length; fi++) {
    const file = files[fi];
    const filePath = join(DATA_DIR, file);
    const progress = `[${fi + 1}/${files.length}]`;

    try {
      process.stdout.write(`  ${progress} ${file}...`);

      const fileBuffer = readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

      // 1. Properties
      const properties = parsePropertyAttributes(workbook);
      const propertyMap = new Map(properties.map(p => [p.propertyId, p]));

      const newProps = properties.filter(p => {
        if (seenPropertyIds.has(p.propertyId)) return false;
        seenPropertyIds.add(p.propertyId);
        return true;
      });

      // Write properties with createdAt for Convex
      for (const p of newProps) {
        propsStream.write(JSON.stringify({ ...p, createdAt: Date.now() }) + '\n');
      }
      stats.properties += newProps.length;

      // 2. Rents (all months)
      const rents = parseAllRents(workbook, propertyMap);
      appendJsonl(rentStream, rents);
      stats.rentRecords += rents.length;

      // 3. Occupancy (all months)
      const occupancy = parseAllOccupancy(workbook, propertyMap);
      appendJsonl(occStream, occupancy);
      stats.occupancyRecords += occupancy.length;

      // 4. Concessions (all months)
      const concessions = parseAllConcessions(workbook, propertyMap);
      appendJsonl(concStream, concessions);
      stats.concessionRecords += concessions.length;

      console.log(` ${newProps.length} props | ${rents.length} rent | ${occupancy.length} occ | ${concessions.length} conc`);
      stats.filesProcessed++;

      // Let GC breathe between large files
      if (fi % 20 === 19) {
        global.gc && global.gc();
      }

    } catch (err) {
      console.log(` ERROR: ${err.message}`);
      stats.filesErrored++;
    }
  }

  // Close streams
  await Promise.all([
    new Promise(r => propsStream.end(r)),
    new Promise(r => rentStream.end(r)),
    new Promise(r => occStream.end(r)),
    new Promise(r => concStream.end(r)),
  ]);

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  Parse Complete');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`  Files processed:    ${stats.filesProcessed}`);
  console.log(`  Files errored:      ${stats.filesErrored}`);
  console.log(`  Properties:         ${stats.properties.toLocaleString()}`);
  console.log(`  Rent records:       ${stats.rentRecords.toLocaleString()}`);
  console.log(`  Occupancy records:  ${stats.occupancyRecords.toLocaleString()}`);
  console.log(`  Concession records: ${stats.concessionRecords.toLocaleString()}`);
  console.log(`  Output dir:         ${OUTPUT_DIR}`);
  console.log('══════════════════════════════════════════════════════════\n');
}

// ─── Phase 2: Import JSONL → Convex ──────────────────────────────
async function importPhase() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  Phase 2: Import JSONL → Convex');
  console.log('══════════════════════════════════════════════════════════\n');

  const tables = [
    { table: 'multifamilyproperties', file: 'properties.jsonl' },
    { table: 'rentData', file: 'rentData.jsonl' },
    { table: 'occupancyData', file: 'occupancyData.jsonl' },
    { table: 'concessionData', file: 'concessionData.jsonl' },
  ];

  for (const { table, file } of tables) {
    const filePath = join(OUTPUT_DIR, file);
    if (!existsSync(filePath)) {
      console.log(`  ⚠ Skipping ${table}: ${file} not found`);
      continue;
    }

    // Count lines
    const lineCount = execSync(`wc -l < "${filePath}"`).toString().trim();
    console.log(`  Importing ${table}: ${parseInt(lineCount).toLocaleString()} records from ${file}...`);

    try {
      const output = execSync(
        `npx convex import --table "${table}" --append -y "${filePath}"`,
        {
          cwd: PROJECT_ROOT,
          timeout: 600000, // 10 min per table
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );
      console.log(`    ✓ ${table} imported successfully`);
      if (output.toString().trim()) {
        console.log(`    ${output.toString().trim()}`);
      }
    } catch (err) {
      console.error(`    ✗ ${table} import failed: ${err.stderr?.toString() || err.message}`);
    }
  }

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  Import Complete');
  console.log('══════════════════════════════════════════════════════════\n');
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  HomeU Market Data — Full Historical Import');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Source:  ${DATA_DIR}`);
  console.log(`  Output:  ${OUTPUT_DIR}`);
  if (FILE_LIMIT) console.log(`  Limit:   ${FILE_LIMIT} files`);
  if (FILE_PATTERN) console.log(`  Pattern: ${FILE_PATTERN}`);
  if (PARSE_ONLY) console.log(`  Mode:    Parse only (JSONL output)`);
  if (IMPORT_ONLY) console.log(`  Mode:    Import only (from existing JSONL)`);
  console.log('═══════════════════════════════════════════════════════════');

  if (!IMPORT_ONLY) {
    await parsePhase();
  }

  if (!PARSE_ONLY) {
    await importPhase();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
