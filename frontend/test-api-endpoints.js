#!/usr/bin/env node

/**
 * Script de Testing para Endpoints API - Stegmaier LMS
 * Prueba endpoints que previamente devolvían HTML en producción
 */

const axios = require('axios');

// Configuración
const API_BASE_URL = 'https://stegmaier-backend-production.up.railway.app/api/v1';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-jwt-token-here';

// Headers de autenticación
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`
});

// Lista de endpoints críticos para probar
const ENDPOINTS_TO_TEST = [
  // Analytics endpoints que devolvían HTML
  {
    name: 'Progress Summary',
    url: `${API_BASE_URL}/progress/summary`,
    method: 'GET',
    requiresAuth: true,
    expectedType: 'json'
  },
  {
    name: 'User Analytics - My Stats',
    url: `${API_BASE_URL}/analytics/users/me`,
    method: 'GET',
    requiresAuth: true,
    expectedType: 'json'
  },
  {
    name: 'Platform Metrics',
    url: `${API_BASE_URL}/analytics/platform`,
    method: 'GET',
    requiresAuth: true,
    expectedType: 'json'
  },
  // Endpoints básicos de verificación
  {
    name: 'Available Courses',
    url: `${API_BASE_URL}/courses/available`,
    method: 'GET',
    requiresAuth: false,
    expectedType: 'json'
  },
  {
    name: 'Health Check',
    url: `${API_BASE_URL}/health`,
    method: 'GET',
    requiresAuth: false,
    expectedType: 'json'
  }
];

/**
 * Prueba un endpoint específico
 */
async function testEndpoint(endpoint) {
  console.log(`\n🧪 Testing: ${endpoint.name}`);
  console.log(`   URL: ${endpoint.url}`);
  
  try {
    const config = {
      method: endpoint.method,
      url: endpoint.url,
      timeout: 10000,
      headers: endpoint.requiresAuth ? getAuthHeaders() : { 'Content-Type': 'application/json' }
    };

    const response = await axios(config);
    
    // Verificar status code
    if (response.status >= 200 && response.status < 300) {
      console.log(`   ✅ Status: ${response.status}`);
    } else {
      console.log(`   ⚠️  Status: ${response.status}`);
    }
    
    // Verificar Content-Type
    const contentType = response.headers['content-type'] || '';
    console.log(`   📄 Content-Type: ${contentType}`);
    
    // Verificar si es JSON o HTML
    const isJson = contentType.includes('application/json');
    const isHtml = contentType.includes('text/html');
    
    if (endpoint.expectedType === 'json' && isJson) {
      console.log(`   ✅ Expected JSON - Got JSON`);
    } else if (endpoint.expectedType === 'json' && isHtml) {
      console.log(`   ❌ Expected JSON - Got HTML! (PROBLEMA DETECTADO)`);
      return { success: false, error: 'HTML_INSTEAD_OF_JSON', endpoint: endpoint.name };
    } else {
      console.log(`   ⚠️  Content-Type inesperado: ${contentType}`);
    }
    
    // Verificar estructura de datos (si es JSON)
    if (isJson && response.data) {
      console.log(`   📊 Response keys: ${Object.keys(response.data).join(', ')}`);
      
      // Verificar estructura específica para algunos endpoints
      if (endpoint.name.includes('Summary')) {
        console.log(`   📈 Summary data structure: ${typeof response.data}`);
      }
    }
    
    console.log(`   ✅ Test PASSED`);
    return { success: true, endpoint: endpoint.name, status: response.status, contentType };
    
  } catch (error) {
    console.log(`   ❌ Test FAILED`);
    
    if (error.response) {
      console.log(`   📛 Status: ${error.response.status}`);
      console.log(`   📛 Error: ${error.response.statusText}`);
      
      // Si devuelve HTML cuando esperamos JSON
      const errorContentType = error.response.headers['content-type'] || '';
      if (errorContentType.includes('text/html') && endpoint.expectedType === 'json') {
        console.log(`   🚨 CRITICAL: Endpoint devolvió HTML en lugar de JSON`);
        return { 
          success: false, 
          error: 'HTML_RESPONSE_ON_ERROR', 
          endpoint: endpoint.name,
          status: error.response.status 
        };
      }
    } else if (error.request) {
      console.log(`   📛 Network Error: No response received`);
    } else {
      console.log(`   📛 Error: ${error.message}`);
    }
    
    return { 
      success: false, 
      error: error.response?.status || 'NETWORK_ERROR', 
      endpoint: endpoint.name 
    };
  }
}

/**
 * Ejecuta todos los tests
 */
async function runAllTests() {
  console.log('🚀 Iniciando Tests de Endpoints API');
  console.log('=====================================');
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log(`Using Auth: ${TEST_TOKEN ? 'Yes' : 'No (set TEST_TOKEN env var)'}`);
  
  const results = [];
  let passedCount = 0;
  let failedCount = 0;
  
  for (const endpoint of ENDPOINTS_TO_TEST) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      passedCount++;
    } else {
      failedCount++;
    }
    
    // Pausa pequeña entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Resumen final
  console.log('\n📊 RESUMEN DE TESTS');
  console.log('===================');
  console.log(`✅ Passed: ${passedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📈 Success Rate: ${((passedCount / (passedCount + failedCount)) * 100).toFixed(1)}%`);
  
  // Detectar problemas críticos
  const criticalIssues = results.filter(r => 
    r.error === 'HTML_INSTEAD_OF_JSON' || 
    r.error === 'HTML_RESPONSE_ON_ERROR'
  );
  
  if (criticalIssues.length > 0) {
    console.log('\n🚨 PROBLEMAS CRÍTICOS DETECTADOS:');
    criticalIssues.forEach(issue => {
      console.log(`   - ${issue.endpoint}: ${issue.error}`);
    });
    console.log('\n❗ Estos endpoints aún devuelven HTML en lugar de JSON');
  } else {
    console.log('\n🎉 No se detectaron problemas de HTML en endpoints JSON');
  }
  
  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:');
  if (failedCount > 0) {
    console.log('   - Revisar endpoints fallidos en el backend');
    console.log('   - Verificar configuración de rutas FastAPI');
    console.log('   - Asegurar headers Content-Type correctos');
  } else {
    console.log('   - ✅ Todos los tests pasaron');
    console.log('   - ✅ Configuración API centralizada funcionando');
  }
  
  return results;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  console.log('Para usar este script:');
  console.log('1. npm install axios (si no está instalado)');
  console.log('2. Opcional: export TEST_TOKEN="your-jwt-token"');
  console.log('3. node test-api-endpoints.js');
  console.log('');
  
  runAllTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Error ejecutando tests:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testEndpoint, ENDPOINTS_TO_TEST };
