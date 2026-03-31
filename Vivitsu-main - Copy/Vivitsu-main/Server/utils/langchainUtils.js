import { ChatGroq } from "@langchain/groq";
import { HuggingFaceInferenceAPIEmbeddings } from "@langchain/community/embeddings/hf";

// Initialize LangChain models with environment variables
let chatModel = null;
let embeddingsModel = null;

/**
 * Get or initialize the Groq chat model
 */
export function getChatModel() {
    if (!chatModel) {
        chatModel = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
            modelName: "mixtral-8x7b-32768",
            temperature: 0.7,
            maxTokens: 2048,
        });
    }
    return chatModel;
}

/**
 * Get or initialize the Hugging Face embeddings model
 */
export function getEmbeddingsModel() {
    if (!embeddingsModel) {
        embeddingsModel = new HuggingFaceInferenceAPIEmbeddings({
            apiKey: process.env.HUGGING_FACE_API_KEY,
            model: "sentence-transformers/all-MiniLM-L6-v2",
        });
    }
    return embeddingsModel;
}

/**
 * Generates an embedding for the given text using LangChain + Hugging Face.
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
            setTimeout(() => reject(new Error("Embedding request timed out")), 30000); // 30s timeout
        });

        const embedPromise = (async () => {
            const model = getEmbeddingsModel();
            const embedding = await model.embedQuery(text.trim());
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
        console.error("Error generating embedding with LangChain:", error.message);
        return null;
    }
}

/**
 * Chat with the LLM using LangChain + Groq.
 * @param {Array} messages - Array of message objects [{ role: 'user', content: '...' }]
 * @returns {Promise<string>} - The assistant's response content.
 */
export async function chatResponse(messages) {
    try {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Chat request timed out after 300 seconds")), 300000); // 5 min timeout
        });

        const chatPromise = (async () => {
            const model = getChatModel();
            
            // Convert messages to LangChain format if needed
            const langchainMessages = messages.map(msg => ({
                role: msg.role,
                content: msg.content,
            }));

            const response = await model.invoke(langchainMessages);
            return response.content;
        })();

        const response = await Promise.race([chatPromise, timeoutPromise]);
        return response;
    } catch (error) {
        console.error("Error calling Groq chat with LangChain:", error.message);
        if (error.message.includes("timed out")) {
            return "I'm sorry, I'm waiting too long for a response. Please try asking a shorter question.";
        }
        throw error;
    }
}

/**
 * Analyze text/content - using Groq's text capabilities
 * @param {Buffer} imageBuffer - The image buffer (Note: Limited support without vision models)
 * @returns {Promise<string>} - The description/analysis of the content.
 */
export async function analyzeImage(imageBuffer) {
    try {
        if (!imageBuffer) throw new Error("No image buffer provided");

        console.warn("Note: Image analysis is not currently supported. Using text-based approach.");
        return "Image analysis is not currently supported. Please describe the image content in text instead.";
    } catch (error) {
        console.error("Error analyzing image:", error.message);
        return "Failed to analyze image. Image analysis is not currently supported.";
    }
}

/**
 * Get model information
 */
export function getModelInfo() {
    return {
        chat: {
            provider: "Groq",
            model: "mixtral-8x7b-32768",
            context_window: 32768,
        },
        embeddings: {
            provider: "Hugging Face",
            model: "sentence-transformers/all-MiniLM-L6-v2",
            dimensions: 384,
        },
    };
}
