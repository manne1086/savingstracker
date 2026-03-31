import dotenv from "dotenv";

dotenv.config();

/**
 * Chat with Gemini Model using direct REST API (v1).
 * URL: https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent
 * @param {Array} messages - Array of message objects [{ role: 'system'|'user'|'assistant', content: '...' }]
 * @returns {Promise<string>} - The assistant's response content.
 */
export async function chatResponse(messages) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing in environment variables.");
        }

        const apiKey = process.env.GEMINI_API_KEY;
        const model = "gemini-2.0-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        // 1. Separate System Instruction from History
        let systemInstructionText = "";
        const contents = [];

        for (const msg of messages) {
            if (msg.role === "system") {
                systemInstructionText += msg.content + "\n\n";
            } else if (msg.role === "user") {
                contents.push({
                    role: "user",
                    parts: [{ text: msg.content }]
                });
            } else if (msg.role === "assistant") {
                contents.push({
                    role: "model",
                    parts: [{ text: msg.content }]
                });
            }
        }

        // 2. Construct Payload
        // v1 API might not support 'systemInstruction' field directly for 1.5-pro in some contexts,
        // so we merge it into the first user message to be safe.

        if (systemInstructionText && contents.length > 0) {
            // Find first user message
            const firstUserMsg = contents.find(c => c.role === "user");
            if (firstUserMsg) {
                firstUserMsg.parts[0].text = `System Instruction:\n${systemInstructionText}\n\nUser Question:\n${firstUserMsg.parts[0].text}`;
            } else {
                // If no user message (rare), create one
                contents.unshift({
                    role: "user",
                    parts: [{ text: `System Instruction:\n${systemInstructionText}` }]
                });
            }
        }

        const payload = {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000,
            }
        };

        // Removed dedicated systemInstruction field to avoid 400 error

        // 3. Send Request
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Gemini API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();

        // Extract text
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("No content generated.");
        }

        return text;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return `Gemini Error: ${error.message}`;
    }
}
