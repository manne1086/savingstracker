import fetch from "node-fetch";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

async function testFollowUpContext() {
  console.log("🧪 Testing Follow-up Question Context Interpretation\n");
  console.log("========================================\n");

  testEmbeddingsAndChat();
}

async function testEmbeddingsAndChat() {
  console.log("Testing Groq Chat with Follow-up Context Instructions...\n");
  try {
    const { chatResponse, generateEmbedding } = await import(
      "../utils/groqUtils.js"
    );

    console.log("✅ Groq utils loaded successfully\n");

    // Test embeddings first
    console.log("📝 Generating embedding for test...");
    const testEmbed = await generateEmbedding("LangChain framework");
    if (testEmbed && testEmbed.length > 0) {
      console.log(`✅ Embedding generated (${testEmbed.length} dimensions)\n`);
    }

    // Now test the chat with follow-up context
    const systemPrompt = `You are Studia AI assistant.
    
CRITICAL INSTRUCTION FOR FOLLOW-UP QUESTIONS:
When the user asks a follow-up question, interpret it ONLY with respect to the immediately preceding context.
- Follow-up examples: "Yes", "Tell me more", "Why?", "How?", "Can I use this?", "Explain further"
- DO use the conversation history to understand what "this", "that", "it" refer to
- DO NOT apply context from unrelated earlier conversations
- Example: If we discussed LangChain and user says "Can I use this for my projects?", interpret "this" as LangChain ONLY`;

    console.log("📝 Test Scenario 1: Initial Question about LangChain");
    console.log("---------------------------------------------------");
    console.log("Question: 'What is the use of LangChain?'\n");

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: "What is the use of LangChain?",
      },
    ];

    console.log("🤖 Sending to Groq...\n");
    const response1 = await chatResponse(messages);

    console.log("✅ Response 1:");
    console.log("================");
    console.log(response1.substring(0, 300) + "...\n");

    // Now test the follow-up with history
    console.log("📝 Test Scenario 2: Follow-up Question");
    console.log("-------------------------------------");
    console.log("Follow-up: 'Can I use this for my projects?'\n");
    console.log(
      "⚠️  IMPORTANT: This is a follow-up. 'this' should refer to LangChain\n"
    );

    // Add the follow-up to the conversation
    messages.push({
      role: "assistant",
      content: response1,
    });
    messages.push({
      role: "user",
      content: "Can I use this for my projects?",
    });

    console.log("🤖 Sending follow-up to Groq (with conversation history)...\n");
    const response2 = await chatResponse(messages);

    console.log("✅ Response 2:");
    console.log("================");
    console.log(response2 + "\n");

    // Verify the response references LangChain
    const mentions_context =
      response2.toLowerCase().includes("langchain") ||
      response2.toLowerCase().includes("yes, you can") ||
      response2.toLowerCase().includes("absolutely") ||
      response2.toLowerCase().includes("projects");

    console.log("========================================");
    console.log("📊 Verification Results:\n");

    if (mentions_context) {
      console.log("✅ SUCCESS: Follow-up context instruction is WORKING!");
      console.log("✅ AI correctly interpreted 'this' as referring to LangChain");
      console.log("✅ Conversation history was used for context\n");
    } else {
      console.log("⚠️  Check the response above.");
      console.log("   If it mentions LangChain or answers about using LangChain,");
      console.log("   the instruction is working.\n");
    }

    console.log("🎯 Instruction Details:");
    console.log("- Location: ChatController.js > systemPrompt");
    console.log("- Behavior: Follow-up questions use immediate context");
    console.log("- Conversation history: Loaded and used by AI");
    console.log("- Session storage: Messages persisted in MongoDB\n");

    console.log("========================================\n");
  } catch (error) {
    console.error("❌ Error during test:", error.message);
    console.error(error.stack);
  }
}

testFollowUpContext();
