import { useEffect, useRef, useState } from "react";
import "./App.css";
import lumaLogo from "./assets/logo.png";

function App() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "أهلاً بك في Luma AI 👋 كيف أستطيع مساعدتك؟",
    },
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (customMessage) => {
    const textToSend = customMessage || message;
    if (!textToSend.trim()) return;

    setMessages((prev) => [
      ...prev,
      { text: textToSend, sender: "user" },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("https://luma-chatbot-n4naqqzoh-luma11.vercel.app/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages,
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { text: data.reply, sender: "bot" },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: "حصل خطأ بالاتصال بالسيرفر", sender: "bot" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "شو خدمات لوما؟",
    "بدي خدمة سوشيال ميديا",
    "شو حلول الذكاء الاصطناعي؟",
    "بدي أحجز استشارة",
  ];

  return (
    <div className="page">
      <div className="chat-wrapper">
        <div className="top-bar">
          <div>
            <h1>
              <span>LUMA</span> AI
            </h1>
            <p>Smart Sales Assistant</p>
          </div>

          <a href="/leads" className="dashboard-btn">
            Dashboard
          </a>
        </div>

        <div className="assistant-card">
          <div className="bot-avatar big-logo">
            <img src={lumaLogo} alt="Luma Logo" />
          </div>

          <div>
            <h2>
              Luma AI Assistant <span className="online-dot"></span>
            </h2>
            <p>
              مساعد ذكي للرد على العملاء وتحويل المهتمين إلى Leads تلقائياً.
            </p>
          </div>

          <span className="online-badge">Online</span>
        </div>

        <div className="quick-buttons">
          {quickQuestions.map((q, index) => (
            <button key={index} onClick={() => sendMessage(q)}>
              {q}
            </button>
          ))}
        </div>

        <div className="chat-box">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={
                msg.sender === "user"
                  ? "message-row user-row"
                  : "message-row bot-row"
              }
            >
              {msg.sender === "bot" && (
                <div className="avatar logo-avatar">
                  <img src={lumaLogo} alt="Luma" />
                </div>
              )}

              <div className={msg.sender === "user" ? "message user" : "message bot"}>
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row bot-row">
              <div className="avatar logo-avatar">
                <img src={lumaLogo} alt="Luma" />
              </div>

              <div className="message bot typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        <div className="input-area">
          <button className="attach-btn" type="button">📎</button>

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك..."
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          <button onClick={() => sendMessage()}>إرسال</button>
        </div>
      </div>
    </div>
  );
}

export default App;