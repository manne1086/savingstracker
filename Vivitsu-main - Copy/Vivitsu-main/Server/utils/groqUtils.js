import Groq from "groq-sdk";
import { pipeline } from "@xenova/transformers";

// Initialize Groq client lazily to ensure .env is loaded
let groq = null;
let embeddingPipeline = null;

function getGroqClient() {
    if (!groq) {
        groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });
    }
    return groq;
}

async function getEmbeddingPipeline() {
    if (!embeddingPipeline) {
        embeddingPipeline = await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2"
        );
    }
    return embeddingPipeline;
}

/**
 * Generates an embedding for the given text using Transformers.js (local).
 * @param {string} text - The text to generate an embedding for.
 * @returns {Promise<number[]|null>} - The embedding vector or null if failed.
 */
export async function generateEmbedding(text) {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
        console.error("Invalid text for embedding");
        return null;
    }

    try {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Embedding request timed out")), 60000); // 60s timeout for first init
        });

        const embedPromise = (async () => {
            const pipe = await getEmbeddingPipeline();
            const embeddings = await pipe(text.trim(), {
                pooling: "mean",
                normalize: true,
            });
            // Transformers.js returns a Float32Array with embeddings
            const embedding = embeddings.data ? Array.from(embeddings.data) : embeddings;
            return embedding;
        })();

        const embedding = await Promise.race([embedPromise, timeoutPromise]);
        
        // Ensure it's a valid array of numbers
        if (Array.isArray(embedding) && embedding.length > 0 && typeof embedding[0] === 'number') {
            return embedding;
        }
        
        console.error("Invalid embedding format received");
        return null;
    } catch (error) {
        console.error("Error generating embedding:", error.message);
        return null;
    }
}

/**
 * Chat with the LLM using Groq API.
 * @param {Array} messages - Array of message objects [{ role: 'user', content: '...' }]
 * @returns {Promise<string>} - The assistant's response content.
 */
export async function chatResponse(messages) {
    try {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Groq request timed out after 300 seconds")), 300000); // 5 min timeout
        });

        const chatPromise = (async () => {
            const response = await getGroqClient().chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: messages,
                max_tokens: 2048,
            });

            return response.choices[0].message.content;
        })();

        const response = await Promise.race([chatPromise, timeoutPromise]);
        return response;
    } catch (error) {
        console.error("Error calling Groq chat:", error.message);
        // Fallback or rethrow
        if (error.message.includes("timed out")) {
            return "I'm sorry, I'm waiting too long for a response. Please try asking a shorter question.";
        }
        throw error;
    }
}

/**
 * Analyze image - not currently supported
 * @param {Buffer} imageBuffer - The image buffer
 * @returns {Promise<string>} - The description/analysis of the content.
 */
export async function analyzeImage(imageBuffer) {
    try {
        if (!imageBuffer) throw new Error("No image buffer provided");

        console.warn("Note: Image analysis is not currently supported.");
        return "Image analysis is not currently supported. Please describe the image content in text instead.";
    } catch (error) {
        console.error("Error analyzing image:", error.message);
        return "Failed to analyze image. Image analysis is not currently supported.";
    }
}
