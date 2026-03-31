import fetch from "node-fetch";

const hfKey = "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";

// Test with transformer.js approach or alternative HF endpoint
async function testHF() {
  const endpoints = [
    // Recommended by HF for serverless API
    {
      url: "https://router.huggingface.co/api/models/sentence-transformers/all-MiniLM-L6-v2",
      name: "router API v1",
    },
    // Serverless inference v2
    {
      url: "https://router.huggingface.co/api/tasks/feature-extraction/models/sentence-transformers/all-MiniLM-L6-v2",
      name: "router tasks endpoint",
    },
    // Direct model inference
    {
      url: "https://router.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
      name: "router direct",
    },
  ];

  for (const { url, name } of endpoints) {
    try {
      console.log(`\n📝 Testing: ${name}`);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: "Studia test",
          options: { wait_for_model: true },
        }),
      });
      console.log(`   Status: ${res.status}`);
      const text = await res.text();
      if (res.ok) {
        console.log(`   ✅ SUCCESS`);
        console.log(`   Response preview: ${text.substring(0, 100)}`);
      } else {
        console.log(`   Response: ${text.substring(0, 150)}`);
      }
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}`);
    }
  }

  // Try embeddings model directly
  console.log("\n\n🔄 Trying direct model endpoint...");
  try {
    const res = await fetch(
      "https://router.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: "test" }),
      }
    );
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data).substring(0, 200));
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

testHF();
