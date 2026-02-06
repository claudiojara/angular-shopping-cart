#!/usr/bin/env node

/**
 * audit-schema.mjs
 * Audita la coherencia del esquema SQL antes de ejecutar
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer todos los scripts SQL
const sqlDir = resolve(__dirname, 'sql');

const scripts = [
  '01-create-base-tables.sql',
  '02-create-products-table.sql',
  '05-create-variants-table.sql',
  '06-create-reviews-table.sql',
  '07-improve-cart-items.sql',
  '08-create-indexes.sql',
  '09-create-rls-policies.sql',
  '10-create-functions.sql',
  '11-create-views.sql',
  '12-insert-seed-data.sql',
];

// Extraer definiciones de tablas
const tables = {
  materials: [],
  categories: [],
  tags: [],
  products: [],
  product_variants: [],
  reviews: [],
  cart_items: [],
};

console.log('🔍 AUDITANDO COHERENCIA DEL ESQUEMA SQL\n');
console.log('='.repeat(80));

// Función para extraer columnas de CREATE TABLE
function extractTableColumns(sqlContent, tableName) {
  const regex = new RegExp(`CREATE TABLE[^(]*${tableName}[^(]*\\(([^;]+)\\)`, 'is');
  const match = sqlContent.match(regex);

  if (!match) return [];

  const columnsBlock = match[1];
  const lines = columnsBlock.split('\n');
  const columns = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('CONSTRAINT')) continue;

    // Extraer nombre de columna
    const colMatch = trimmed.match(/^([a-z_]+)\s+/);
    if (colMatch) {
      columns.push(colMatch[1]);
    }
  }

  return columns;
}

// Leer definiciones de tablas
console.log('\n📋 PASO 1: Extrayendo definiciones de tablas...\n');

const script01 = readFileSync(resolve(sqlDir, '01-create-base-tables.sql'), 'utf-8');
const script02 = readFileSync(resolve(sqlDir, '02-create-products-table.sql'), 'utf-8');
const script05 = readFileSync(resolve(sqlDir, '05-create-variants-table.sql'), 'utf-8');
const script06 = readFileSync(resolve(sqlDir, '06-create-reviews-table.sql'), 'utf-8');
const script07 = readFileSync(resolve(sqlDir, '07-improve-cart-items.sql'), 'utf-8');

tables.materials = extractTableColumns(script01, 'materials');
tables.categories = extractTableColumns(script01, 'categories');
tables.tags = extractTableColumns(script01, 'tags');
tables.products = extractTableColumns(script02, 'products');
tables.product_variants = extractTableColumns(script05, 'product_variants');
tables.reviews = extractTableColumns(script06, 'reviews');

// Para cart_items, buscar ADD COLUMN
const cartCols = script07.match(/ADD COLUMN\s+([a-z_]+)\s+/gi) || [];
tables.cart_items = ['id', 'user_id', 'product_id', 'quantity', 'created_at', 'updated_at'];
cartCols.forEach((match) => {
  const col = match.match(/ADD COLUMN\s+([a-z_]+)/i);
  if (col && !tables.cart_items.includes(col[1])) {
    tables.cart_items.push(col[1]);
  }
});

// Mostrar esquema extraído
for (const [tableName, columns] of Object.entries(tables)) {
  console.log(`✓ ${tableName}: ${columns.length} columnas`);
  console.log(`  ${columns.join(', ')}`);
}

console.log('\n' + '='.repeat(80));
console.log('\n🔎 PASO 2: Verificando referencias en otros scripts...\n');

const script08 = readFileSync(resolve(sqlDir, '08-create-indexes.sql'), 'utf-8');
const script09 = readFileSync(resolve(sqlDir, '09-create-rls-policies.sql'), 'utf-8');
const script10 = readFileSync(resolve(sqlDir, '10-create-functions.sql'), 'utf-8');
const script11 = readFileSync(resolve(sqlDir, '11-create-views.sql'), 'utf-8');
const script12 = readFileSync(resolve(sqlDir, '12-insert-seed-data.sql'), 'utf-8');

const allScripts = {
  '08-indexes': script08,
  '09-rls': script09,
  '10-functions': script10,
  '11-views': script11,
  '12-seed': script12,
};

let errorCount = 0;
const errors = [];

// Verificar cada tabla
for (const [tableName, columns] of Object.entries(tables)) {
  console.log(`\n📊 Verificando tabla: ${tableName}`);

  for (const [scriptName, content] of Object.entries(allScripts)) {
    // Buscar referencias a columnas de esta tabla
    const tableRefs = content.match(new RegExp(`${tableName}\\.[a-z_]+`, 'gi')) || [];
    const directRefs = content.match(/\b([a-z_]+)\b/g) || [];

    for (const ref of [...tableRefs, ...directRefs]) {
      const colName = ref.includes('.') ? ref.split('.')[1] : ref;

      // Columnas comunes que pueden no estar en CREATE TABLE
      const commonCols = ['id', 'created_at', 'updated_at'];

      // Verificar si la columna existe
      if (
        colName.match(/^[a-z_]+$/) &&
        !columns.includes(colName) &&
        !commonCols.includes(colName) &&
        colName !== tableName
      ) {
        // Buscar contexto
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (
            lines[i].includes(colName) &&
            (lines[i].includes(tableName) ||
              lines[i].toLowerCase().includes('where') ||
              lines[i].toLowerCase().includes('select'))
          ) {
            const error = {
              script: scriptName,
              table: tableName,
              column: colName,
              line: i + 1,
              context: lines[i].trim(),
            };

            // Solo agregar si parece un error real
            if (
              lines[i].toLowerCase().includes('where') &&
              lines[i].includes(colName) &&
              !errors.find((e) => e.column === colName && e.table === tableName)
            ) {
              errors.push(error);
              errorCount++;
            }
          }
        }
      }
    }
  }
}

console.log('\n' + '='.repeat(80));
console.log('\n📝 PASO 3: Verificando INSERTs contra esquema...\n');

// Verificar INSERT de materials
const materialsInsert = script12.match(/INSERT INTO materials \(([^)]+)\)/i);
if (materialsInsert) {
  const insertCols = materialsInsert[1].split(',').map((c) => c.trim());
  console.log(`✓ INSERT materials: ${insertCols.join(', ')}`);

  for (const col of insertCols) {
    if (!tables.materials.includes(col)) {
      errors.push({
        script: '12-seed',
        table: 'materials',
        column: col,
        context: 'INSERT statement references non-existent column',
      });
      errorCount++;
      console.log(`  ❌ Columna ${col} no existe en tabla materials`);
    }
  }
}

// Verificar INSERT de categories
const categoriesInsert = script12.match(/INSERT INTO categories \(([^)]+)\)/i);
if (categoriesInsert) {
  const insertCols = categoriesInsert[1].split(',').map((c) => c.trim());
  console.log(`✓ INSERT categories: ${insertCols.join(', ')}`);

  for (const col of insertCols) {
    if (!tables.categories.includes(col)) {
      errors.push({
        script: '12-seed',
        table: 'categories',
        column: col,
        context: 'INSERT statement references non-existent column',
      });
      errorCount++;
      console.log(`  ❌ Columna ${col} no existe en tabla categories`);
    }
  }
}

// Verificar INSERT de tags
const tagsInsert = script12.match(/INSERT INTO tags \(([^)]+)\)/i);
if (tagsInsert) {
  const insertCols = tagsInsert[1].split(',').map((c) => c.trim());
  console.log(`✓ INSERT tags: ${insertCols.join(', ')}`);

  for (const col of insertCols) {
    if (!tables.tags.includes(col)) {
      errors.push({
        script: '12-seed',
        table: 'tags',
        column: col,
        context: 'INSERT statement references non-existent column',
      });
      errorCount++;
      console.log(`  ❌ Columna ${col} no existe en tabla tags`);
    }
  }
}

console.log('\n' + '='.repeat(80));
console.log('\n📊 RESUMEN DE AUDITORÍA\n');

if (errorCount === 0) {
  console.log('✅ ¡ESQUEMA COHERENTE! No se encontraron errores.');
  console.log('\n✨ Puedes ejecutar el archivo all-migrations-combined.sql con confianza.\n');
  process.exit(0);
} else {
  console.log(`❌ Se encontraron ${errorCount} posibles problemas:\n`);

  const uniqueErrors = errors.filter(
    (e, i, arr) => arr.findIndex((e2) => e2.column === e.column && e2.table === e.table) === i,
  );

  for (const error of uniqueErrors) {
    console.log(`  • ${error.script}: ${error.table}.${error.column}`);
    if (error.context) {
      console.log(`    "${error.context.substring(0, 80)}..."`);
    }
  }

  console.log('\n⚠️  Revisa estos errores antes de ejecutar la migración.\n');
  process.exit(1);
}
