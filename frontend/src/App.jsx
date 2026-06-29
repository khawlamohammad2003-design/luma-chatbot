import { useEffect, useRef, useState } from "react";
import "./App.css";
import lumaLogo from "./assets/logo.png";
import { useState, useEffect, useRef } from "react";
function App() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [blocked, setBlocked] = useState(false);
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
    if (blocked) {
  setMessages((prev) => [
    ...prev,
    {
      sender: "bot",
      text: "🚫 تم إيقاف هذه المحادثة بسبب تكرار استخدام ألفاظ غير لائقة.",
    },
  ]);
  return;
}
    if (!textToSend.trim()) return;

    setMessages((prev) => [
      ...prev,
      { text: textToSend, sender: "user" },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("https://luma-chatbot-green.vercel.app/chat", {
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

const rudeReply =
  data.reply &&
  data.reply.includes("لا يمكنني الاستمرار في المحادثة");

if (rudeReply) {
  const newCount = warningCount + 1;
  setWarningCount(newCount);

  if (newCount >= 2) {
    setBlocked(true);

    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text: "🚫 تم إيقاف المحادثة بسبب تكرار استخدام ألفاظ غير لائقة.",
      },
    ]);

    setLoading(false);
    return;
  }
}

setMessages((prev) => [
  ...prev,
  {
    text: data.reply,
    sender: "bot",
    whatsapp: data.whatsapp,
  },
]);

    setLoading(false);
    return;
  }
}

      setMessages((prev) => [
  ...prev,
  {
    text: data.reply,
    sender: "bot",
    whatsapp: data.whatsapp,
  },
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
        {/*
<a
  href="/#/leads"
  className="dashboard-btn"
>
  Dashboard
</a>
*/}
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
  <p
    dangerouslySetInnerHTML={{
      __html: msg.text.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      ),
    }}
  />

  {msg.whatsapp && (
    <a
      href={msg.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-btn"
    >
      📲 التقديم عبر واتساب
    </a>
  )}
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