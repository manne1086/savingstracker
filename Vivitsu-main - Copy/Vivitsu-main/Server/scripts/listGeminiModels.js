import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config({ path: "./.env" });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("No GEMINI_API_KEY found in ../.env");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
    try {
        console.log(`Checking models with key: ${apiKey.substring(0, 10)}...`);
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error);
            return;
        }

        if (data.models) {
            const fs = await import('fs');
            const output = data.models.map(m => m.name).join('\n');
            fs.writeFileSync('scripts/models_output.txt', output);
            console.log("Wrote models to scripts/models_output.txt");
        } else {
            console.log("No models found:", data);
        }

    } catch (error) {
        console.error("Request failed:", error);
    }
}

listModels();
