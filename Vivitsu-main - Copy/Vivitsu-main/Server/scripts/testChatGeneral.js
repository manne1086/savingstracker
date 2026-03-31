
async function testChatGeneral() {
    console.log("Sending 'How can i learn DSA step by step. provide me a roadmap.' to /api/chat...");
    try {
        const response = await fetch("http://127.0.0.1:3000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "How can i learn DSA step by step. provide me a roadmap.",
                history: []
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("\nResponse from Chatbot:");
        console.log("---------------------------------------------------");
        console.log(data.reply);
        console.log("---------------------------------------------------");

    } catch (error) {
        console.error("Test Failed:", error.message);
        console.log("Ensure the server is running with 'npm run dev'");
    }
}

testChatGeneral();
