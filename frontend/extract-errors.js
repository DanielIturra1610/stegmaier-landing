const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
  
  console.log('=== TESTS FALLIDOS ===\n');
  
  data.testResults.forEach(suite => {
    const failedTests = suite.assertionResults.filter(test => test.status === 'failed');
    
    if (failedTests.length > 0) {
      console.log(`📁 Suite: ${suite.name.split('/').pop()}`);
      console.log(`-`.repeat(50));
      
      failedTests.forEach(test => {
        console.log(`❌ Test: ${test.title}`);
        console.log(`   Full Name: ${test.fullName}`);
        
        if (test.failureMessages && test.failureMessages.length > 0) {
          const firstLine = test.failureMessages[0].split('\n')[0];
          console.log(`   Error: ${firstLine}`);
        }
        console.log('');
      });
    }
  });
  
  console.log(`\n📊 Resumen: ${data.numFailedTests} tests fallidos de ${data.numTotalTests} totales`);
  
} catch (error) {
  console.error('Error leyendo archivo:', error.message);
}
