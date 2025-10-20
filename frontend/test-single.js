// Script para ejecutar un test específico
const { execSync } = require('child_process');

try {
  console.log('Ejecutando LoginForm test...');
  execSync('npx vitest run src/tests/components/auth/LoginForm.test.tsx --reporter=verbose', { stdio: 'inherit' });
} catch (error) {
  console.log('Test completado con errores:', error.status);
}
