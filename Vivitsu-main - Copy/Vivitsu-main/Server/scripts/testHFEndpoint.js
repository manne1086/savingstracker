import fetch from "node-fetch";

const hfKey = "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";

async function testEndpoint(url, name) {
  try {
    console.log(`\nTesting: ${name}`);
    console.log(`URL: ${url}`);
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
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text.substring(0, 300)}`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

(async () => {
  await testEndpoint(
    "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
    "api-inference (old endpoint)"
  );

  await testEndpoint(
    "https://router.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
    "router.huggingface.co"
  );

  await testEndpoint(
    "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
    "api-inference with pipeline"
  );

  await testEndpoint(
    "https://router.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
    "router with pipeline"
  );
})();
