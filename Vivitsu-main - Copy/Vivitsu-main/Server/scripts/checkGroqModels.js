import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

console.log("Fetching available Groq models...\n");

try {
  const models = await groq.models.list();
  
  console.log("Available Groq Models:");
  console.log("=====================\n");
  
  models.data.forEach(model => {
    console.log(`- ${model.id}`);
  });
  
  console.log("\n\nRecommended models:");
  console.log("===================");
  const chatModels = models.data.filter(m => m.id.includes("mixtral") || m.id.includes("llama"));
  chatModels.forEach(m => console.log(`✓ ${m.id}`));
  
} catch (error) {
  console.error("Error:", error.message);
}
