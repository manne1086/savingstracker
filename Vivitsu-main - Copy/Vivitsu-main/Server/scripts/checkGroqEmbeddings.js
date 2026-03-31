import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: "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",
});

(async () => {
  try {
    // Check if Groq has embeddings endpoint
    const embeddingTest = await groq.embeddings.create({
      model: "llama-3.3-70b-versatile",
      input: "test embedding",
    });
    console.log("✅ Groq Embeddings Supported!");
    console.log(embeddingTest);
  } catch (error) {
    console.log("❌ Groq Embeddings Error:", error.message);
    console.log(
      "Groq SDK methods available:",
      Object.keys(groq).filter((k) => !k.startsWith("_"))
    );
  }
})();
