#!/usr/bin/env node

/**
 * Script para ejecutar tests con configuración específica
 */

const { execSync } = require('child_process');

console.log('🚀 Ejecutando tests del frontend...\n');

try {
  // Ejecutar tests básicos
  execSync('npx vitest run --reporter=basic', { stdio: 'inherit', cwd: process.cwd() });
  console.log('\n✅ Todos los tests completados exitosamente!');
} catch (error) {
  console.log('\n❌ Algunos tests fallaron. Revisar errores arriba.');
  process.exit(1);
}
