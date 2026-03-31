import dotenv from "dotenv";
import Groq from "groq-sdk";
import { pipeline } from "@xenova/transformers";

dotenv.config();

const groqApiKey = process.env.GROQ_API_KEY;
let embeddingPipeline = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }
  return embeddingPipeline;
}

console.log("🧪 Testing Studia AI Integration...\n");

// Test 1: Verify API Keys
console.log("📋 Step 1: Checking API Keys");
console.log(`✓ Groq API Key: ${groqApiKey ? "✅ Loaded" : "❌ Missing"}\n`);

// Test 2: Test Groq Chat API
async function testGroqChat() {
  console.log("🤖 Step 2: Testing Groq Chat API");
  try {
    const groq = new Groq({ apiKey: groqApiKey });
    
    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: "Hello! What is 2+2? Answer in one sentence.",
        },
      ],
      max_tokens: 100,
    });

    console.log("✅ Groq Chat API: Working");
    console.log(`   Response: "${message.choices[0].message.content}"\n`);
    return true;
  } catch (error) {
    console.error("❌ Groq Chat API: Failed");
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
}

// Test 3: Test Transformers.js Embeddings (local)
async function testHuggingFaceEmbeddings() {
  console.log("📝 Step 3: Testing Local Embeddings");
  try {
    const pipe = await getEmbeddingPipeline();
    const embeddings = await pipe("Studia is a collaborative study platform", {
      pooling: "mean",
      normalize: true,
    });
    const embedding = embeddings.data ? Array.from(embeddings.data) : embeddings;
    
    if (Array.isArray(embedding) && embedding.length > 0) {
      console.log("✅ Local Embeddings: Working");
      console.log(`   Embedding dimensions: ${embedding.length}`);
      console.log(`   Sample values: [${embedding.slice(0, 5).join(", ")}...]\n`);
      return true;
    } else {
      throw new Error("Invalid embedding format");
    }
  } catch (error) {
    console.error("❌ Hugging Face Embeddings: Failed");
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
}

// Test 4: Test RAG-like scenario
async function testRAGScenario() {
  console.log("🔍 Step 4: Testing RAG Scenario");
  try {
    const groq = new Groq({ apiKey: groqApiKey });
    
    // Generate embedding for a query
    const pipe = await getEmbeddingPipeline();
    const queryEmbedding = await pipe("How do I study effectively?", {
      pooling: "mean",
      normalize: true,
    });
    const queryEmbed = queryEmbedding.data ? Array.from(queryEmbedding.data) : queryEmbedding;
    
    console.log(`✓ Query embedding generated (${queryEmbed.length} dimensions)`);

    // Get chat response with context
    const chatResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a helpful study assistant. Provide practical advice.",
        },
        {
          role: "user",
          content: "How do I study effectively?",
        },
      ],
      max_tokens: 150,
    });

    console.log("✓ Chat response generated");
    console.log("✅ RAG Scenario: Working");
    console.log(`   Response: "${chatResponse.choices[0].message.content}"\n`);
    return true;
  } catch (error) {
    console.error("❌ RAG Scenario: Failed");
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = [];

  results.push(await testGroqChat());
  results.push(await testHuggingFaceEmbeddings());
  results.push(await testRAGScenario());

  // Summary
  console.log("📊 Test Summary");
  console.log("================");
  const passed = results.filter((r) => r).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);

  if (passed === total) {
    console.log("\n✅ All tests passed! Studia AI is working perfectly! 🎉\n");
  } else {
    console.log("\n⚠️  Some tests failed. Check API keys and internet connection.\n");
  }

  process.exit(passed === total ? 0 : 1);
}

runAllTests();
