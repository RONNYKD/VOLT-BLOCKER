/**
 * AI System Test Runner - Script to test the AI rehabilitation system
 * Run this to validate that all AI services are working correctly
 */
import { aiInitializer } from '../initialization/AIInitializer';

/**
 * Main test function
 */
async function testAISystem() {
  console.log('🧪 Testing AI Rehabilitation System...\n');

  try {
    // Run full initialization
    const initResult = await aiInitializer.initializeAISystem();
    
    // Generate and display report
    const report = aiInitializer.generateInitializationReport(initResult);
    console.log(report);

    // Quick status check
    const quickCheck = await aiInitializer.quickCheck();
    console.log('\n📊 Quick Status Check:');
    console.log(`- Initialized: ${quickCheck.initialized ? '✅' : '❌'}`);
    console.log(`- API Key Configured: ${quickCheck.apiKeyConfigured ? '✅' : '❌'}`);
    console.log(`- Services Ready: ${quickCheck.servicesReady ? '✅' : '❌'}`);
    
    if (quickCheck.issues.length > 0) {
      console.log('\n⚠️ Issues Found:');
      quickCheck.issues.forEach(issue => console.log(`- ${issue}`));
    }

    if (initResult.readyForProduction) {
      console.log('\n🎉 AI Rehabilitation System is ready for production!');
    } else {
      console.log('\n⚠️ AI Rehabilitation System needs attention before production use.');
    }

    return initResult;
  } catch (error) {
    console.error('❌ AI System test failed:', error);
    throw error;
  }
}

// Export for use in other modules
export { testAISystem };

// Run if called directly
if (require.main === module) {
  testAISystem()
    .then(() => {
      console.log('\n✅ AI system test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ AI system test failed:', error);
      process.exit(1);
    });
}