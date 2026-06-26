import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const WAEC_TOPICS = [
  "Algebra",
  "Geometry",
  "Trigonometry",
  "Calculus",
  "Statistics",
  "Number Theory",
  "Functions",
  "Sequences and Series",
  "Vectors",
  "Complex Numbers",
  "Logarithms",
  "Quadratic Equations",
  "Polynomials",
  "Inequalities",
  "Circle Theorems",
  "Matrices",
];

export default function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("Algebra");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue("");
    setError("");

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, topic: selectedTopic },
    ]);

    setLoading(true);

    try {
      const response = await fetch("/.netlify/functions/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          topic: selectedTopic,
          conversationHistory: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get explanation");
      }

      const data = await response.json();

      // Add assistant message to chat
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>📐 WAEC Math Tutor</h1>
          <p className="subtitle">Master any concept with guided explanations</p>
        </div>
      </header>

      <div className="container">
        <div className="topic-selector">
          <label htmlFor="topic-select">Select Topic:</label>
          <select
            id="topic-select"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            disabled={loading}
          >
            {WAEC_TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        <div className="chat-container">
          <div className="messages">
            {messages.length === 0 ? (
              <div className="welcome">
                <h2>Welcome to WAEC Math Tutor</h2>
                <p>Ask me about any {selectedTopic} concept or problem.</p>
                <ul>
                  <li>✓ Ask for explanations of concepts</li>
                  <li>✓ Get step-by-step breakdowns</li>
                  <li>✓ Learn through guiding questions</li>
                  <li>✓ Master WAEC topics confidently</li>
                </ul>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="message-content">
                    {msg.role === "user" ? (
                      <p>{msg.content}</p>
                    ) : (
                      <div className="formatted-response">
                        {msg.content.split("\n---\n").map((section, i) => (
                          <div key={i}>
                            {section
                              .split("\n")
                              .map((line, lineIdx) => (
                                <React.Fragment key={lineIdx}>
                                  {line.startsWith("**") ? (
                                    <p className="question-box">
                                      {line.replace(/\*\*/g, "")}
                                    </p>
                                  ) : line ? (
                                    <p>{line}</p>
                                  ) : null}
                                </React.Fragment>
                              ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="message assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="message error">
                <div className="message-content">
                  <p>⚠️ {error}</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <div className="input-wrapper">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask about ${selectedTopic}... (Shift+Enter for new line)`}
                disabled={loading}
                rows="3"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !inputValue.trim()}
                className="send-btn"
              >
                {loading ? "Thinking..." : "Send"}
              </button>
            </div>
            {messages.length > 0 && (
              <button onClick={clearChat} className="clear-btn">
                Clear Chat
              </button>
            )}
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <p>Built for WAEC success | Powered by Claude AI</p>
      </footer>
    </div>
  );
}
