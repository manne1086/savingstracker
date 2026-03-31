import { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { Brain, Spline, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Import modular components and hooks
import { useChatState } from "./hooks/useChatState";
import { useTypingEffect } from "./hooks/useTypingEffect";
import { useResizable } from "./hooks/useResizable";
import { useLocalStorage } from "./hooks/useLocalStorage";

import { ChatHeader } from "./components/ChatHeader";
import { MessagesContainer } from "./components/MessagesContainer";
import { InputArea } from "./components/InputArea";

import { GUIDED_EXPERIENCES, HARDCODED_RESPONSES, QUICK_ACTIONS } from "./utils/constants";
import { formatBoldText } from "./utils/formatters";
import { getHardcodedResponse } from "./utils/helpers";

import "./styles/animations.css";

const apikey = import.meta.env.VITE_GEMINI_KEY;

// Variants for the chat panel
const panelVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

// Variants for each chat message
const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1 },
  }),
};

const AiChatbot = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Use custom hooks for state management
  const {
    messages,
    setMessages,
    conversationContext,
    setConversationContext,
    loading,
    setLoading,
    isChatOpen,
    setIsChatOpen,
    dimensions,
    setDimensions,
    showVideoSection,
    setShowVideoSection,
    showQuickActions,
    setShowQuickActions,
    isQuickActionsExpanded,
    setIsQuickActionsExpanded,
    copiedMessageId,
    setCopiedMessageId,
    editingMessageId,
    setEditingMessageId,
    editedText,
    setEditedText,
    apiError,
    setApiError,
    isOnline,
    setIsOnline,
    isTyping,
    setIsTyping,
    rateLimitInfo,
    setRateLimitInfo,
    currentExperience,
    setCurrentExperience,
    setCurrentStep,
    experienceAnswers,
    setExperienceAnswers,
    typingMessages,
    setTypingMessages,
    clearChat,
    closeModal
  } = useChatState();

  const { startTypingEffect, typingIntervalRef } = useTypingEffect(setTypingMessages);
  const { resizing, handleMouseDown, handleMouseMove, handleMouseUp } = useResizable(dimensions, setDimensions);
  const { saveMessages, loadMessages } = useLocalStorage();

  // State for Agenda/Search Modal - REMOVED (Replaced by Studia AI page)

  const debounceTimerRef = useRef(null);

  // Monitor user changes and reload chat messages accordingly
  useEffect(() => {
    const handleStorageChange = () => {
      const newMessages = loadMessages();
      setMessages(newMessages);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [setMessages, loadMessages]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages, saveMessages]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOnline]);

  useEffect(() => {
    const modalEl = document.getElementById("my_modal_1");
    if (modalEl) {
      modalEl.showModal = () => {
        setIsChatOpen(true);
        setShowVideoSection(false);
      };
      modalEl.close = () => {
        closeModal();
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      };
    }
  }, [setIsChatOpen, setShowVideoSection, closeModal, typingIntervalRef]);

  // scroll chat to end - but respect user scrolling during typing
  useEffect(() => {
    if (isChatOpen && chatContainerRef.current) {
      const chatContainer = chatContainerRef.current;

      // Don't auto-scroll during typing effects
      const isTypingEffectRunning = Object.keys(typingMessages).length > 0;

      if (!isTypingEffectRunning) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [isChatOpen, messages, typingMessages]);

  // Separate effect for when typing completes
  useEffect(() => {
    if (isChatOpen && chatContainerRef.current) {
      const chatContainer = chatContainerRef.current;
      const lastMessage = messages[messages.length - 1];

      if (lastMessage && lastMessage.type === "ai") {
        const typingState = typingMessages[lastMessage.id];

        // Scroll when typing completes
        if (typingState && typingState.isComplete) {
          setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }, 100);
        }
      }
    }
  }, [typingMessages, isChatOpen, messages]);

  useEffect(() => {
    if (isChatOpen && !showVideoSection && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen, showVideoSection]);

  const debouncedAction = useCallback((action, delay = 500) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      action();
    }, delay);
  }, []);

  // Start a guided experience
  const startGuidedExperience = (experienceKey) => {
    setCurrentExperience(experienceKey);
    setCurrentStep(0);
    setExperienceAnswers({});

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

  // Handle option selection in guided experience
  const handleOptionSelect = (option, stepIndex) => {
    const experience = GUIDED_EXPERIENCES[currentExperience];
    const currentStepData = experience.steps[stepIndex];

    // Save answer
    setExperienceAnswers(prev => ({
      ...prev,
      [currentStepData.type]: option
    }));

    // Add user's selection to messages
    const userMessage = {
      id: Date.now(),
      type: "user",
      text: option,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMessage]);

    // Check if there are more steps
    if (stepIndex < experience.steps.length - 1) {
      // Move to next step
      const nextStep = stepIndex + 1;
      setCurrentStep(nextStep);

      const nextStepData = experience.steps[nextStep];

      setTimeout(() => {
        const nextMessage = {
          id: Date.now() + 1,
          type: "ai",
          text: nextStepData.question,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isGuided: true,
          step: nextStep,
          options: nextStepData.options
        };

        setMessages(prev => [...prev, nextMessage]);
      }, 500);
    } else {
      // Final step - show summary
      setCurrentExperience(null);
      setCurrentStep(0);

      setTimeout(() => {
        const sessionData = {
          ...experienceAnswers,
          [currentStepData.type]: option
        };

        const finalResponse = experience.finalResponse(sessionData);

        // Check if we need to save the study plan
        if (currentExperience === "study planning" && sessionData.savePlan === "Yes, save plan") {
          const createPlan = async () => {
            try {
              const res = await fetch("http://localhost:3000/study-sessions/auto-plan", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(sessionData)
              });

              const data = await res.json();
              if (res.ok) {
                const successMsg = {
                  id: Date.now() + 2,
                  type: "ai",
                  text: `✅ Success! I've created detailed study sessions for **${sessionData.subject}** starting tomorrow. Check your calendar!`,
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                };
                setMessages(prev => [...prev, successMsg]);
                setConversationContext(prev => [...prev, { role: "assistant", text: successMsg.text }]);
              } else {
                throw new Error(data.error || "Failed to create plan");
              }
            } catch (err) {
              console.error("Plan creation failed:", err);
              const errorMsg = {
                id: Date.now() + 2,
                type: "ai",
                text: `⚠️ I had trouble saving the plan to your calendar. Please try again later.`,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              };
              setMessages(prev => [...prev, errorMsg]);
            }
          };
          createPlan();
        }

        const finalMessage = {
          id: Date.now() + 1,
          type: "ai",
          text: finalResponse,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setMessages(prev => [...prev, finalMessage]);
        setConversationContext(prev => [
          ...prev,
          { role: "assistant", text: finalResponse }
        ].slice(-10));
      }, 500);
    }
  };

  const generateQuestion = async (customQuestion = null) => {
    const questionToAsk = customQuestion || question;

    if (!questionToAsk.trim()) {
      return;
    }

    if (!isOnline) {
      setApiError("You are offline. Please check your internet connection.");
      return;
    }

    setLoading(true);
    setIsTyping(true);
    setApiError(null);

    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: questionToAsk,
      time: currentTime
    };

    setMessages((prev) => [...prev, userMessage]);

    // Check for hardcoded response or guided experience first
    const response = getHardcodedResponse(questionToAsk, GUIDED_EXPERIENCES, HARDCODED_RESPONSES);

    if (response) {
      if (response.type === 'guided') {
        // Start guided experience
        setTimeout(() => {
          startGuidedExperience(response.experience);
          setLoading(false);
          setIsTyping(false);
          setQuestion("");
          setShowQuickActions(false);
          setIsQuickActionsExpanded(false);
        }, 1000);
        return;
      } else if (response.type === 'hardcoded') {
        // Use hardcoded response with typing effect
        setTimeout(() => {
          const aiMessageId = Date.now() + 1;
          const aiMessage = {
            id: aiMessageId,
            type: "ai",
            text: response.response,
            time: currentTime,
          };

          setMessages((prev) => [...prev, aiMessage]);
          setConversationContext(prev => [
            ...prev,
            { role: "assistant", text: response.response }
          ].slice(-10));

          // Start typing effect for hardcoded response
          startTypingEffect(aiMessageId, response.response);

          setLoading(false);
          setIsTyping(false);
          setQuestion("");
          setShowQuickActions(false);
          setIsQuickActionsExpanded(false);
        }, 500);
        return;
      }
    }

    // Use AI model for other queries
    // Construct history from visible messages (persisted in localStorage)
    const historyPayload = messages
      .filter(m => m.type === 'user' || m.type === 'ai')
      .map(m => ({
        role: m.type === 'ai' ? 'assistant' : 'user',
        content: m.text
      }))
      .slice(-10); // Keep last 10 turns context

    // Add current user question to context for display/logic (optional, but keep for consistency elsewhere if needed)
    const updatedContext = [
      ...historyPayload,
      { role: "user", content: questionToAsk }
    ].slice(-10);
    setConversationContext(updatedContext); // We keep updating this for now to avoid breaking other things, but we won't rely on it for fetch

    try {
      const response = await fetch(
        "http://localhost:3000/api/chat", // Use local RAG endpoint
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`, // Add Auth token
          },
          body: JSON.stringify({
            message: questionToAsk,
            history: historyPayload // Use the history derived from persistent messages
          }),
        }
      );

      const data = await response.json();

      if (data && data.reply) {
        const generatedResponse = data.reply;

        // Create AI message
        const aiMessageId = Date.now() + 1;
        const aiMessage = {
          id: aiMessageId,
          type: "ai",
          text: generatedResponse,
          time: currentTime,
        };

        setMessages((prev) => [...prev, aiMessage]);
        setLoading(false);
        setIsTyping(false);

        // Start typing effect for AI response
        startTypingEffect(aiMessageId, generatedResponse);

        setConversationContext(prev => [
          ...prev,
          { role: "assistant", text: generatedResponse }
        ].slice(-10));
      }
    } catch (error) {
      console.error("Error generating response:", error);
      setApiError(
        "Failed to get response from AI. Please try again."
      );
      setLoading(false);
      setIsTyping(false);
    } finally {
      setQuestion("");
      setShowQuickActions(false);
      setIsQuickActionsExpanded(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      debouncedAction(() => generateQuestion(), 300);
    }
  };

  const handleCopyMessage = (messageText, messageId) => {
    navigator.clipboard.writeText(messageText).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  };

  const handleEditMessage = (messageId, messageText) => {
    setEditingMessageId(messageId);
    setEditedText(messageText);
  };

  const saveEditedMessage = () => {
    if (!editedText.trim()) return;

    const messageIndex = messages.findIndex(msg => msg.id === editingMessageId);
    if (messageIndex === -1) return;

    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      text: editedText,
      edited: true,
    };

    const finalMessages = updatedMessages.slice(0, messageIndex + 1);

    setMessages(finalMessages);
    setEditingMessageId(null);
    setEditedText("");

    if (updatedMessages[messageIndex].type === "user") {
      generateQuestion(editedText);
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditedText("");
  };

  const stopGeneration = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    setLoading(false);
    setIsTyping(false);

    // Add "Stopped" message
    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const stoppedMessage = {
      id: Date.now() + 1,
      type: "ai",
      text: "Whoa, stop! That wasn't what you were expecting, was it?",
      time: currentTime,
    };

    setMessages(prev => [...prev, stoppedMessage]);
    setConversationContext(prev => [
      ...prev,
      { role: "assistant", text: "Whoa, stop! That wasn't what you were expecting, was it?" }
    ].slice(-10));

    // Clear any ongoing typing effects
    setTypingMessages({});
  };

  // Attach mouse move and up event listeners for resizing
  useEffect(() => {
    if (resizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [resizing, handleMouseMove, handleMouseUp]);

  // Listen for questions... REMOVED (Handled by Inline Chat now)
  /* 
  useEffect(() => {
    ...
  }, []);
  */

  return (
    <div id="manishai">
      {/* Ask AI Button - Brain icon only - Keeps existing functionality as a fallback/alternative */}
      <Button
        size="icon"
        variant="secondary"
        className="bg-[var(--bg-sec)] hover:bg-[var(--bg-ter)] rounded-lg"
        onClick={() => {
          const modalEl = document.getElementById("my_modal_1");
          modalEl && modalEl.showModal();
        }}
        title="Ask AI"
      >
        <Brain className="w-5 h-5 text-red-500" />
      </Button>

      {/* Chat Panel: render into document.body via portal so close is reliable */}
      {ReactDOM.createPortal(
        <div
          // overlay container
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            pointerEvents: isChatOpen ? "auto" : "none",
          }}
        >
          {/* overlay: clicking outside closes */}
          <div
            onClick={() => setIsChatOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: isChatOpen ? "rgba(0,0,0,0.4)" : "transparent",
              backdropFilter: isChatOpen ? "blur(4px)" : "none",
              transition: "all 300ms",
            }}
          />

          <motion.div
            id="my_modal_1"
            variants={panelVariants}
            initial="hidden"
            animate={isChatOpen ? "visible" : "hidden"}
            exit="hidden"
            style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              width: dimensions.width,
              height: dimensions.height,
              maxWidth: "calc(100vw - 40px)",
              maxHeight: "calc(100vh - 40px)",
              zIndex: 51,
            }}
            onClick={(e) => e.stopPropagation()}
            key="ai-portal-panel"
          >
            <div
              className="chat-panel-wrapper bg-primary rounded-3xl w-full h-full txt flex flex-col overflow-hidden relative"
              style={{
                boxShadow: `0 20px 60px rgba(var(--shadow-rgb), 0.5), 0 0 100px rgba(var(--shadow-rgb), 0.2)`,
                border: "1px solid rgba(var(--shadow-rgb), 0.2)",
              }}
            >
              {/* Resizer handle using the Spline icon */}
              <div
                onMouseDown={handleMouseDown}
                className="absolute top-2 left-2 p-2 cursor-nw-resize z-50 hover:bg-hover-red hover:text-txt-red rounded-lg transition-all duration-200"
                style={{
                  background: "rgba(var(--shadow-rgb), 0.1)",
                }}
              >
                <Spline className="w-5 h-5 txt-dim" />
              </div>

              {/* Close Button - Right Top Corner */}
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 p-2 z-50 hover:bg-hover-red rounded-lg transition-all duration-200 txt-dim hover:text-txt-red hover:rotate-90"
                style={{
                  background: "rgba(var(--shadow-rgb), 0.1)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <ChatHeader
                isOnline={isOnline}
                messages={messages}
                onClearChat={clearChat}
                onClose={closeModal}
              />

              {/* Messages Container */}
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
                onGenerateQuestion={generateQuestion}
                onStopGeneration={stopGeneration}
                onSetIsQuickActionsExpanded={setIsQuickActionsExpanded}
                typingMessages={typingMessages}
                isTyping={isTyping}
                onKeyDown={handleKeyDown}
                debouncedAction={debouncedAction}
              />
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AiChatbot;