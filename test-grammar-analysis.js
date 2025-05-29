// test-grammar-analysis.js - Teste da análise de gramática

const { grammarAnalysisService } = require('./lib/grammar-analysis.ts');

async function testGrammarAnalysis() {
  console.log('🧪 Testing Grammar Analysis Service...\n');

  const testCases = [
    {
      text: "Hello, my name is John and I work in marketing.",
      level: "Intermediate",
      name: "John"
    },
    {
      text: "me like pizza very much",
      level: "Novice", 
      name: "Maria"
    },
    {
      text: "The comprehensive analysis of contemporary market dynamics necessitates a multifaceted approach to strategic implementation.",
      level: "Advanced",
      name: "Robert"
    },
    {
      text: "I am study english every day for improve my skills",
      level: "Intermediate",
      name: "Carlos"
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📝 Test ${i + 1}: ${testCase.level} Level`);
    console.log(`Text: "${testCase.text}"`);
    console.log('---');

    try {
      const result = await grammarAnalysisService.analyzeText(
        testCase.text,
        testCase.level,
        testCase.name
      );

      console.log('✅ Analysis Results:');
      console.log(`📊 Grammar Score: ${result.analysis.overallScore}/100`);
      console.log(`❌ Errors Found: ${result.analysis.errors.length}`);
      console.log(`📈 Text Complexity: ${result.analysis.complexity}`);
      console.log(`🎯 XP Awarded: ${result.xpAwarded}`);
      console.log(`💬 Feedback: ${result.feedback.substring(0, 100)}...`);
      
      if (result.analysis.errors.length > 0) {
        console.log('\n🔍 Errors Details:');
        result.analysis.errors.forEach((error, idx) => {
          console.log(`  ${idx + 1}. ${error.type}: "${error.original}" → "${error.correction}"`);
          console.log(`     ${error.explanation}`);
        });
      }

    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Executar teste
testGrammarAnalysis()
  .then(() => {
    console.log('\n🎉 Grammar analysis testing completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Testing failed:', error);
    process.exit(1);
  }); 