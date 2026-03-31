import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Modular Components & Hooks from AiChatbot
import { useChatState } from "../components/home/navBar/AiChatbot/hooks/useChatState";
import { useTypingEffect } from "../components/home/navBar/AiChatbot/hooks/useTypingEffect";
// import { useLocalStorage } from "../components/home/navBar/AiChatbot/hooks/useLocalStorage"; 
import { MessagesContainer } from "../components/home/navBar/AiChatbot/components/MessagesContainer";
import { InputArea } from "../components/home/navBar/AiChatbot/components/InputArea";
import { ChatSidebar } from "../components/home/navBar/AiChatbot/components/ChatSidebar";
import { GUIDED_EXPERIENCES, HARDCODED_RESPONSES, QUICK_ACTIONS } from "../components/home/navBar/AiChatbot/utils/constants";
import { formatBoldText } from "../components/home/navBar/AiChatbot/utils/formatters";
import { getHardcodedResponse } from "../components/home/navBar/AiChatbot/utils/helpers";

const StudiaAI = () => {
    // Local State for Hero Input
    const [heroInput, setHeroInput] = useState("");
    const inputRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Sidebar & Session State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    // Initial message variant for animations
    const messageVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1 },
        }),
    };

    // Use shared chat state logic
    const {
        messages,
        setMessages,
        conversationContext,
        setConversationContext,
        loading,
        setLoading,
        isOnline,
        setIsOnline,
        isTyping,
        setIsTyping,
        setApiError,
        apiError,
        rateLimitInfo,
        setRateLimitInfo,
        currentExperience,
        setCurrentExperience,
        setCurrentStep,
        setExperienceAnswers,
        experienceAnswers,
        typingMessages,
        setTypingMessages,
        copiedMessageId,
        setCopiedMessageId,
        editingMessageId,
        setEditingMessageId,
        editedText,
        setEditedText,
        showQuickActions,
        setShowQuickActions,
        isQuickActionsExpanded,
        setIsQuickActionsExpanded,
    } = useChatState();

    const [quizData, setQuizData] = useState(null); // { topic, questions: [], currentQ: 0, score: 0 }



    const { startTypingEffect, typingIntervalRef } = useTypingEffect(setTypingMessages);
    const [question, setQuestion] = useState("");

    // Fetch Sessions on Mount & Reset Chat
    useEffect(() => {
        fetchSessions();
        // Force New Chat on entry
        handleNewChat();

        const handleResetEvent = () => handleNewChat();
        window.addEventListener('reset-studia-ai', handleResetEvent);
        return () => window.removeEventListener('reset-studia-ai', handleResetEvent);
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, typingMessages]);

    // Handle Mobile Sidebar toggle
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        handleResize(); // init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Session Management ---

    const fetchSessions = async () => {
        try {
            const res = await fetch("http://localhost:3000/api/chat/sessions", {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            const data = await res.json();
            if (res.ok) {
                setSessions(data);
            }
        } catch (err) {
            console.error("Failed to fetch sessions", err);
        }
    };

    const loadSession = async (sessionId) => {
        try {
            setLoading(true);
            setCurrentSessionId(sessionId);
            const res = await fetch(`http://localhost:3000/api/chat/sessions/${sessionId}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            const data = await res.json();
            if (res.ok && data.messages) {
                const uiMessages = data.messages.map((m, i) => ({
                    id: m._id || Date.now() + i,
                    type: m.role === 'assistant' ? 'ai' : 'user',
                    text: m.content,
                    time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ''
                }));
                setMessages(uiMessages);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
            }
        } catch (err) {
            console.error("Failed to load session", err);
            setApiError("Failed to load chat history");
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        setCurrentSessionId(null);
        setMessages([]);
        setHeroInput("");
        setQuestion("");
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const handleDeleteSession = async (sessionId) => {
        if (!confirm("Are you sure you want to delete this chat?")) return;
        try {
            await fetch(`http://localhost:3000/api/chat/sessions/${sessionId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            setSessions(prev => prev.filter(s => s._id !== sessionId));
            if (currentSessionId === sessionId) {
                handleNewChat();
            }
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    // --- Guided Experience Logic ---

    const startGuidedExperience = (experienceKey) => {
        setCurrentExperience(experienceKey);
        setCurrentStep(0);
        setExperienceAnswers({});

        if (experienceKey === 'quiz') {
            const guidedMessage = {
                id: Date.now(),
                type: "ai",
                text: "🧠 **Quiz Time!**\n\nPlease type the **topic** you would like to be quizzed on. (e.g., 'Photosynthesis', 'World War II', 'Linear Algebra')",
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                isGuided: true
            };
            setMessages(prev => [...prev, guidedMessage]);
            return;
        }

        const experience = GUIDED_EXPERIENCES[experienceKey];
        const currentStepData = experience.steps[0];

        const guidedMessage = {
            id: Date.now(),
            type: "ai",
            text: `🎯 **${experienceKey.charAt(0).toUpperCase() + experienceKey.slice(1)} Setup**\n\n${currentStepData.question}`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isGuided: true,
            step: 0,
            options: currentStepData.options
        };

        setMessages(prev => [...prev, guidedMessage]);
    };

    const handleOptionSelect = (option, stepIndex) => {
        // --- QUIZ HANDLER ---
        if (currentExperience === 'quiz' && quizData) {
            const currentQ = quizData.questions[quizData.currentQ];
            const isCorrect = option === currentQ.answer;
            const newScore = isCorrect ? quizData.score + 1 : quizData.score;

            // Show User Selection
            setMessages(prev => [...prev, {
                id: Date.now(), type: "user", text: option, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }]);

            setTimeout(() => {
                // Show Result
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    type: "ai",
                    text: isCorrect ? `✅ **Correct!**\n\n${currentQ.explanation || ""}` : `❌ **Incorrect.**\nThe correct answer was: **${currentQ.answer}**.\n\n${currentQ.explanation || ""}`,
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }]);

                // Next Question or End
                if (quizData.currentQ < quizData.questions.length - 1) {
                    const nextQIdx = quizData.currentQ + 1;
                    setQuizData(prev => ({ ...prev, currentQ: nextQIdx, score: newScore }));

                    const nextQ = quizData.questions[nextQIdx];
                    setTimeout(() => {
                        setMessages(prev => [...prev, {
                            id: Date.now() + 2,
                            type: "ai",
                            text: `**Question ${nextQIdx + 1}/${quizData.questions.length}**\n\n${nextQ.question}`,
                            options: nextQ.options,
                            isGuided: true, // Enable options rendering
                            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        }]);
                    }, 1000);
                } else {
                    // End of Quiz
                    const finalScore = newScore;
                    const total = quizData.questions.length;
                    const percentage = Math.round((finalScore / total) * 100);

                    let feedback = "";
                    if (percentage >= 90) feedback = "🏆 Outstanding! You're a master of this topic.";
                    else if (percentage >= 70) feedback = "👏 Great job! You have a solid understanding.";
                    else if (percentage >= 50) feedback = "📚 Good effort! Review the topics you missed to improve.";
                    else feedback = "💪 Keep practicing! You'll get better with more study.";

                    setTimeout(() => {
                        setMessages(prev => [...prev, {
                            id: Date.now() + 3,
                            type: "ai",
                            text: `🏁 **Quiz Completed!**\n\n**Score:** ${finalScore}/${total} (${percentage}%)\n\n${feedback}\n\n*Would you like to try another topic? Type "Quiz Me" to start again!*`,
                            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        }]);
                        setQuizData(null);
                        setCurrentExperience(null);
                    }, 1000);
                }
            }, 500);
            return;
        }

        const experience = GUIDED_EXPERIENCES[currentExperience];
        const currentStepData = experience.steps[stepIndex];

        setExperienceAnswers(prev => ({
            ...prev,
            [currentStepData.type]: option
        }));

        setMessages(prev => [...prev, {
            id: Date.now(),
            type: "user",
            text: option,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }]);

        if (stepIndex < experience.steps.length - 1) {
            const nextStep = stepIndex + 1;
            setCurrentStep(nextStep);
            const nextStepData = experience.steps[nextStep];

            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    type: "ai",
                    text: nextStepData.question,
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    isGuided: true,
                    step: nextStep,
                    options: nextStepData.options
                }]);
            }, 500);
        } else {
            setCurrentExperience(null);
            setCurrentStep(0);
            setTimeout(() => {
                const sessionData = { ...experienceAnswers, [currentStepData.type]: option };
                const finalResponse = experience.finalResponse(sessionData);

                if (currentExperience === "study planning" && sessionData.savePlan === "Yes, save plan") {
                    fetch("http://localhost:3000/study-sessions/auto-plan", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
                        body: JSON.stringify(sessionData)
                    }).then(res => res.json()).then(data => {
                        const msg = {
                            id: Date.now() + 2, type: "ai",
                            text: data.error ? `⚠️ Error: ${data.error}` : `✅ Success! Study sessions created for **${sessionData.subject}**.`,
                            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        };
                        setMessages(prev => [...prev, msg]);
                    }).catch(err => console.error(err));
                }

                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    type: "ai",
                    text: finalResponse,
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }]);
            }, 500);
        }
    };

    // --- Core Logic ---

    const debouncedAction = useCallback((action, delay = 500) => {
        const handler = setTimeout(() => {
            action();
        }, delay);
        return () => clearTimeout(handler);
    }, []);

    const generateQuestion = async (customQuestion = null) => {
        const questionToAsk = customQuestion || question || heroInput;

        if (!questionToAsk.trim()) return;

        console.log("generateQuestion called. currentExperience:", currentExperience, "quizData:", quizData);

        if (!isOnline) {
            setApiError("You are offline.");
            return;
        }

        setLoading(true);
        setIsTyping(true);
        setApiError(null);
        setHeroInput("");
        setQuestion("");

        const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const userMessage = { id: Date.now(), type: "user", text: questionToAsk, time: currentTime };

        setMessages(prev => [...prev, userMessage]);

        // --- QUIZ TOPIC SUBMISSION HANDLER ---
        if (currentExperience === 'quiz' && !quizData) {
            setLoading(true);
            const topic = questionToAsk;
            setQuestion("");

            try {
                const prompt = `
                STRICT COMMAND: Generate a 10-question multiple-choice quiz on the topic: "${topic}".
                
                RULES:
                1. The topic MUST be educational (academic, science, history, arts, technology, etc.). 
                2. If the topic is inappropriate, offensive, or clearly non-educational (e.g. "celebrity gossip", "how to kill", "random nonsense"), return JSON: { "educational": false }.
                3. If valid, return JSON object with: 
                   { 
                     "educational": true, 
                     "questions": [
                       { "question": "Question text", "options": ["Option1", "Option2", "Option3", "Option4"], "answer": "Exact Text of Correct Option", "explanation": "Brief explanation" }
                     ] 
                   }
                4. Output PURE JSON ONLY. No markdown. No pre-text.
                `;

                const res = await fetch("http://localhost:3000/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
                    body: JSON.stringify({ message: prompt, history: [] }),
                });
                const data = await res.json();

                let quizJson = null;
                try {
                    const jsonMatch = data.reply.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        quizJson = JSON.parse(jsonMatch[0]);
                    } else {
                        throw new Error("No JSON found");
                    }
                } catch (e) {
                    console.error("Quiz Parse Error", e);
                    setMessages(prev => [...prev, { id: Date.now() + 1, type: "ai", text: "⚠️ Failed to generate quiz. Please try again with a simpler topic." }]);
                    setLoading(false);
                    return;
                }

                if (!quizJson.educational) {
                    setMessages(prev => [...prev, { id: Date.now() + 1, type: "ai", text: "⚠️ **Non-Educational Topic Detected**\n\nPlease provide strictly educational topics (e.g., Mathematics, History, Physics, Literature). Try again." }]);
                    setLoading(false);
                    return;
                }

                setQuizData({
                    topic: topic,
                    questions: quizJson.questions,
                    currentQ: 0,
                    score: 0
                });

                const firstQ = quizJson.questions[0];
                setMessages(prev => [...prev, {
                    id: Date.now() + 2,
                    type: "ai",
                    text: `**Question 1/10**\n\n${firstQ.question}`,
                    options: firstQ.options,
                    isGuided: true, // Enable options rendering
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }]);

            } catch (err) {
                console.error(err);
                setApiError("Failed to generate quiz.");
            } finally {
                setLoading(false);
                setIsTyping(false); // Fix stuck typing state
            }
            return;
        }

        const response = getHardcodedResponse(questionToAsk, GUIDED_EXPERIENCES, HARDCODED_RESPONSES);
        if (response) {
            setLoading(false);
            setIsTyping(false);
            if (response.type === 'guided') {
                startGuidedExperience(response.experience);
            } else {
                const aiMessageId = Date.now() + 1;
                setMessages(prev => [...prev, { id: aiMessageId, type: "ai", text: response.response, time: currentTime }]);
                startTypingEffect(aiMessageId, response.response);
            }
            return;
        }

        try {
            // Prepare history payload
            const historyPayload = messages.map(msg => ({
                role: msg.type === "ai" ? "assistant" : "user",
                content: msg.text
            }));

            const res = await fetch("http://localhost:3000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify({
                    message: questionToAsk,
                    history: historyPayload, // Now defined
                    sessionId: currentSessionId
                }),
            });
            if (!res.ok) {
                const errorData = await res.text();
                throw new Error(`Server Error: ${res.status} - ${errorData}`);
            }
            const data = await res.json();

            if (data && data.reply) {
                const aiMessageId = Date.now() + 1;
                setMessages(prev => [...prev, { id: aiMessageId, type: "ai", text: data.reply, time: currentTime }]);
                startTypingEffect(aiMessageId, data.reply);

                if (data.sessionId) {
                    if (!currentSessionId) setCurrentSessionId(data.sessionId);
                    fetchSessions();
                }
            }
        } catch (error) {
            console.error("Generate Chat Error:", error);
            setApiError(`Failed to get response: ${error.message}`);
        } finally {
            setLoading(false);
            setIsTyping(false);
            setQuestion("");
        }
    };

    const handleHeroSubmit = (e) => {
        e.preventDefault();
        if (!heroInput.trim()) return;
        generateQuestion(heroInput);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey && !loading) {
            e.preventDefault();
            generateQuestion();
        }
    };

    // Message Handlers
    const handleCopyMessage = (text, id) => { navigator.clipboard.writeText(text).then(() => { setCopiedMessageId(id); setTimeout(() => setCopiedMessageId(null), 2000); }); };
    const handleEditMessage = (id, text) => { setEditingMessageId(id); setEditedText(text); };
    const cancelEdit = () => { setEditingMessageId(null); setEditedText(""); };
    const saveEditedMessage = () => { /* Simplified */ };
    const stopGeneration = () => {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        setLoading(false); setIsTyping(false); setTypingMessages({});
    };

    // --- Render ---

    const showHero = messages.length === 0 && !loading;

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-primary overflow-hidden relative">
            <ChatSidebar
                sessions={sessions}
                currentSessionId={currentSessionId}
                onSelectSession={loadSession}
                onNewChat={handleNewChat}
                onDeleteSession={handleDeleteSession}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col relative w-full h-full">
                <div className="md:hidden absolute top-4 left-4 z-50">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 bg-sec border border-[var(--border)] rounded-lg shadow-sm"
                    >
                        <Menu className="w-5 h-5 txt" />
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {showHero ? (
                        <motion.div
                            key="hero"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="flex-1 flex flex-col items-center justify-center p-4 z-10 w-full max-w-3xl mx-auto text-center"
                        >
                            <h1 className="text-4xl md:text-6xl font-bold txt mb-6">
                                Studia <span className="txt-red">AI</span>
                            </h1>
                            <p className="text-lg md:text-xl txt-dim mb-12">
                                Your intelligent learning assistant. Ask me anything.
                            </p>

                            <form onSubmit={handleHeroSubmit} className="relative group w-full max-w-2xl mx-auto">
                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                    <Search className="h-6 w-6 txt-dim group-focus-within:txt-red transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={heroInput}
                                    onChange={(e) => setHeroInput(e.target.value)}
                                    placeholder="How can I help you study today?"
                                    className="block w-full pl-16 pr-6 py-6 bg-sec border border-[var(--border)] rounded-2xl text-xl txt placeholder-[var(--txt-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--active-red)] focus:border-[var(--txt-red)] transition-all shadow-lg"
                                    autoFocus
                                />

                            </form>

                            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 text-left w-full max-w-2xl mx-auto">
                                {[
                                    { title: "Study Plans", desc: "Create a personalized schedule" },
                                    { title: "Quiz Me", desc: "Test your knowledge" }
                                ].map((item, i) => (
                                    <motion.button
                                        key={i}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => generateQuestion(item.title)}
                                        className="p-4 bg-sec border border-[var(--border)] rounded-xl hover:bg-[var(--bg-ter)] hover:border-[var(--txt-red)] transition-all group"
                                    >
                                        <h3 className="font-semibold txt group-hover:txt-red transition-colors">{item.title}</h3>
                                        <p className="text-sm txt-dim">{item.desc}</p>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat-interface"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col h-full w-full mx-auto bg-primary"
                        >
                            <MessagesContainer
                                messages={messages}
                                typingMessages={typingMessages}
                                apiError={apiError}
                                rateLimitInfo={rateLimitInfo}
                                loading={loading}
                                isTyping={isTyping}
                                chatContainerRef={chatContainerRef}
                                copiedMessageId={copiedMessageId}
                                editingMessageId={editingMessageId}
                                editedText={editedText}
                                onCopyMessage={handleCopyMessage}
                                onEditMessage={handleEditMessage}
                                onSaveEdit={saveEditedMessage}
                                onCancelEdit={cancelEdit}
                                onSetEditedText={setEditedText}
                                onOptionSelect={handleOptionSelect}
                                formatBoldText={formatBoldText}
                                messageVariants={messageVariants}
                            />

                            <div className="p-4 max-w-5xl mx-auto w-full">
                                <InputArea
                                    question={question}
                                    setQuestion={setQuestion}
                                    loading={loading}
                                    isOnline={isOnline}
                                    currentExperience={currentExperience}
                                    showQuickActions={showQuickActions}
                                    isQuickActionsExpanded={isQuickActionsExpanded}
                                    quickActions={QUICK_ACTIONS}
                                    inputRef={inputRef}
                                    onGenerateQuestion={() => generateQuestion()}
                                    onStopGeneration={stopGeneration}
                                    onSetIsQuickActionsExpanded={setIsQuickActionsExpanded}
                                    typingMessages={typingMessages}
                                    isTyping={isTyping}
                                    onKeyDown={handleKeyDown}
                                    debouncedAction={debouncedAction}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StudiaAI;
