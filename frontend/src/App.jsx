import { useEffect, useRef, useState } from "react";
import "./App.css";

import bitWaving from "./assets/Bitwaving3.png";
import bitIcon from "./assets/Bit Icon.png";
import bitLogo from "./assets/BitLogo2.png";
import { parseMessageContent, highlightPython } from "./messageParsing";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/chat";

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const starterMessage = {
  role: "assistant",
  content: `${getGreeting()}! I’m Bit. I’m your coding buddy. How can I help you today?`,
};

function App() {
  const [screen, setScreen] = useState("landing");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem("bit-messages");
    return saved ? JSON.parse(saved) : [starterMessage];
  });

  useEffect(() => {
    sessionStorage.setItem("bit-messages", JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function openChat() {
    setIsTransitioning(true);

    setTimeout(() => {
      setScreen("chat");
      setIsTransitioning(false);
    }, 420);
  }

  async function sendUserMessage(rawText) {
    const cleanInput = rawText.trim();

    if (!cleanInput || isThinking) return;

    const userMessage = {
      role: "user",
      content: cleanInput,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "assistant", content: "" },
    ]);
    setIsThinking(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
  messages: [...messages, userMessage],
}),
      });

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        if (!chunkText) continue;

        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;

          updated[lastIndex] = {
            ...updated[lastIndex],
            content: updated[lastIndex].content + chunkText,
          };

          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;

        updated[lastIndex] = {
          role: "assistant",
          content: "I had trouble thinking for a moment. Try asking me again.",
        };

        return updated;
      });
    } finally {
      setIsThinking(false);
    }
  }

  function sendMessage() {
    const cleanInput = input.trim();

    if (!cleanInput || isThinking) return;

    sendUserMessage(input);
    setInput("");
  }

  function handleOptionClick(messageIndex, option) {
    if (isThinking) return;

    setMessages((prev) => {
      const target = prev[messageIndex];
      if (!target || target.quizAnswer) return prev;

      const updated = [...prev];
      updated[messageIndex] = { ...target, quizAnswer: option.label };
      return updated;
    });

    sendUserMessage(option.text);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  }

  function newChat() {
    const freshStart = [
      {
        role: "assistant",
        content: `${getGreeting()}! I’m Bit. I’m your coding buddy. How can I help you today?`,
      },
    ];

    setMessages(freshStart);
    sessionStorage.setItem("bit-messages", JSON.stringify(freshStart));
  }

  function renderMessageContent(message, messageIndex) {
    const nodes = parseMessageContent(message.content);

    return nodes.map((node, i) => {
      if (node.type === "code") {
        return (
          <pre className="codeBlock" key={i}>
            <div className="codeBlockHeader">Python</div>
            <code>{highlightPython(node.value)}</code>
          </pre>
        );
      }

      if (node.type === "quiz") {
        const answer = message.quizAnswer;

        return (
          <div className="quizBlock" key={i}>
            <p className="quizQuestion">{node.question}</p>
            <div className="quizOptions">
              {node.options.map((option) => {
                const isPicked = answer === option.label;

                return (
                  <button
                    type="button"
                    key={option.label}
                    className={`quizOption ${isPicked ? "quizOptionPicked" : ""}`}
                    disabled={Boolean(answer) || isThinking}
                    onClick={() => handleOptionClick(messageIndex, option)}
                  >
                    <span className="quizOptionLabel">{option.label}</span>
                    {option.text}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      return <span key={i}>{node.value}</span>;
    });
  }

  return (
    <main className="app">
      {screen === "landing" && (
        <section className={`landingPage ${isTransitioning ? "fadeOut" : ""}`}>
          <section className="heroCard">
            <nav className="nav">
              <img src={bitLogo} alt="Bit logo" className="logo" />
            </nav>

            <div className="heroText">
              <h1>
                Meet <span>Bit</span>,
                <br />
                your coding buddy!
              </h1>

              <p>
                Bit helps kids learn, create, and solve problems through coding
                one small step at a time.
              </p>

              <button onClick={openChat} className="startButton">
                Start Chatting <span>→</span>
              </button>
            </div>

            <div className="heroImageArea">
              <img src={bitWaving} alt="Bit waving" className="bitMascot" />

              <div className="speechBubble">
                <strong>Hi! I&apos;m Bit.</strong>
                <br />
                Ask me anything about coding.
              </div>
            </div>
          </section>
        </section>
      )}

      {screen === "chat" && (
        <section className="chatPage">
          <aside className="chatSidebar">
            <img src={bitLogo} alt="Bit logo" className="chatLogo" />

            <button onClick={newChat} className="newChatButton">
              + New Chat
            </button>
          </aside>

          <section className="chatCard">
            <header className="chatHeader">
              <div className="bitProfile">
                <img src={bitIcon} alt="Bit avatar" className="bitAvatar" />

                <div>
                  <h2>Bit</h2>
                  <p>
                    <span className="onlineDot"></span>
                    Online
                  </p>
                </div>
              </div>
            </header>

            <div className="messagesArea">
              {messages.map((message, index) => {
                const isPendingBit =
                  message.role === "assistant" &&
                  message.content === "" &&
                  isThinking &&
                  index === messages.length - 1;

                return (
                  <div
                    key={index}
                    className={`messageRow ${
                      message.role === "user" ? "userRow" : "bitRow"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <img src={bitIcon} alt="Bit" className="miniBit" />
                    )}

                    <div
                      className={`messageBubble ${
                        message.role === "user" ? "userBubble" : "bitBubble"
                      } ${isPendingBit ? "typing" : ""}`}
                    >
                      {isPendingBit ? (
                        <>
                          <span></span>
                          <span></span>
                          <span></span>
                        </>
                      ) : (
                        renderMessageContent(message, index)
                      )}
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef}></div>
            </div>

            <div className="inputArea">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Bit anything about coding..."
                disabled={isThinking}
              />

              <button onClick={sendMessage} disabled={isThinking}>
                →
              </button>
            </div>
          </section>
        </section>
      )}
    </main>
  );
}

export default App;