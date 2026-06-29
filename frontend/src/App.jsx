import { useEffect, useRef, useState } from "react";

const LUMA_LOGO_PLACEHOLDER = null; // Replace with: import lumaLogo from "./assets/logo.png";

const LumaIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
    <circle cx="20" cy="20" r="20" fill="url(#lumaGrad)"/>
    <path d="M12 28 L20 12 L28 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 23 L25.5 23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="lumaGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6C63FF"/>
        <stop offset="100%" stopColor="#3ECFCF"/>
      </linearGradient>
    </defs>
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TypingIndicator = () => (
  <div style={{display:"flex",alignItems:"center",gap:"5px",padding:"12px 16px"}}>
    {[0,1,2].map(i => (
      <span key={i} style={{
        width:"8px",height:"8px",borderRadius:"50%",
        background:"linear-gradient(135deg,#6C63FF,#3ECFCF)",
        animation:`typingBounce 1.2s ease-in-out ${i*0.2}s infinite`
      }}/>
    ))}
  </div>
);

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-deep: #0A0B14;
    --bg-card: #0F1120;
    --bg-surface: #141629;
    --bg-elevated: #1A1D35;
    --border: rgba(108,99,255,0.15);
    --border-glow: rgba(108,99,255,0.4);
    --primary: #6C63FF;
    --primary-light: #8B85FF;
    --teal: #3ECFCF;
    --text-primary: #F0F0FF;
    --text-secondary: #8892B0;
    --text-muted: #4A5275;
    --user-bubble: linear-gradient(135deg, #6C63FF 0%, #4ECDC4 100%);
    --bot-bubble: #141629;
    --shadow-glow: 0 0 40px rgba(108,99,255,0.15);
    --radius-lg: 20px;
    --radius-md: 14px;
    --radius-sm: 10px;
  }

  body { background: var(--bg-deep); color: var(--text-primary); }

  .luma-page {
    min-height: 100vh;
    background: var(--bg-deep);
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(108,99,255,0.12) 0%, transparent 70%),
      radial-gradient(ellipse 60% 40% at 90% 80%, rgba(62,207,207,0.07) 0%, transparent 60%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: 'IBM Plex Sans Arabic', 'Space Grotesk', sans-serif;
  }

  .luma-shell {
    width: 100%;
    max-width: 780px;
    height: 90vh;
    max-height: 860px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 28px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: var(--shadow-glow), 0 40px 80px rgba(0,0,0,0.5);
    position: relative;
  }

  .luma-shell::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 28px;
    padding: 1px;
    background: linear-gradient(145deg, rgba(108,99,255,0.3), transparent 40%, rgba(62,207,207,0.15));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  /* TOP BAR */
  .luma-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    border-bottom: 1px solid var(--border);
    background: rgba(10,11,20,0.8);
    backdrop-filter: blur(12px);
    flex-shrink: 0;
  }

  .luma-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .luma-brand-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    overflow: hidden;
  }

  .luma-brand h1 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: var(--text-primary);
  }

  .luma-brand h1 span {
    background: linear-gradient(135deg, #6C63FF, #3ECFCF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .luma-brand p {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 400;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .luma-status-pill {
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(62,207,207,0.08);
    border: 1px solid rgba(62,207,207,0.2);
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 12px;
    color: var(--teal);
    font-weight: 500;
  }

  .luma-status-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--teal);
    box-shadow: 0 0 8px var(--teal);
    animation: pulse 2s ease-in-out infinite;
  }

  /* HERO CARD */
  .luma-hero {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    background: linear-gradient(135deg, rgba(108,99,255,0.06), rgba(62,207,207,0.03));
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .luma-hero-avatar {
    width: 48px; height: 48px;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(108,99,255,0.3);
    box-shadow: 0 0 20px rgba(108,99,255,0.2);
    flex-shrink: 0;
  }

  .luma-hero-text h2 {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 3px;
  }

  .luma-hero-text p {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  /* QUICK ACTIONS */
  .luma-quick {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    direction: rtl;
  }

  .luma-quick-btn {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    border-radius: 20px;
    padding: 7px 14px;
    font-size: 12.5px;
    font-family: 'IBM Plex Sans Arabic', sans-serif;
    cursor: pointer;
    transition: all 0.22s ease;
    white-space: nowrap;
  }

  .luma-quick-btn:hover {
    background: rgba(108,99,255,0.12);
    border-color: rgba(108,99,255,0.4);
    color: var(--primary-light);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(108,99,255,0.15);
  }

  /* CHAT BOX */
  .luma-chatbox {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    direction: rtl;
    scroll-behavior: smooth;
  }

  .luma-chatbox::-webkit-scrollbar { width: 4px; }
  .luma-chatbox::-webkit-scrollbar-track { background: transparent; }
  .luma-chatbox::-webkit-scrollbar-thumb {
    background: rgba(108,99,255,0.25);
    border-radius: 10px;
  }

  /* MESSAGE ROWS */
  .msg-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    animation: msgSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  .msg-row.user { flex-direction: row-reverse; }
  .msg-row.bot { flex-direction: row; }

  .msg-avatar {
    width: 32px; height: 32px;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid rgba(108,99,255,0.25);
  }

  .msg-bubble {
    max-width: 72%;
    padding: 13px 16px;
    border-radius: var(--radius-md);
    font-size: 14px;
    line-height: 1.7;
    word-break: break-word;
  }

  .msg-bubble.user {
    background: var(--user-bubble);
    color: #fff;
    border-bottom-left-radius: 4px;
    box-shadow: 0 4px 20px rgba(108,99,255,0.3);
    text-align: right;
  }

  .msg-bubble.bot {
    background: var(--bot-bubble);
    border: 1px solid var(--border);
    color: var(--text-primary);
    border-bottom-right-radius: 4px;
    text-align: right;
  }

  .msg-bubble a {
    color: var(--teal);
    text-decoration: underline;
    text-underline-offset: 3px;
    word-break: break-all;
  }

  /* WHATSAPP BUTTON */
  .wa-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 9px 18px;
    background: linear-gradient(135deg, #25D366, #128C7E);
    color: #fff;
    border-radius: 10px;
    text-decoration: none !important;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 4px 16px rgba(37,211,102,0.25);
  }

  .wa-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(37,211,102,0.4);
  }

  /* TYPING */
  .typing-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    direction: rtl;
  }

  .typing-bubble {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    border-bottom-right-radius: 4px;
  }

  /* INPUT AREA */
  .luma-inputbar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    border-top: 1px solid var(--border);
    background: rgba(10,11,20,0.7);
    backdrop-filter: blur(12px);
    flex-shrink: 0;
    direction: rtl;
  }

  .luma-input {
    flex: 1;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 12px 18px;
    color: var(--text-primary);
    font-family: 'IBM Plex Sans Arabic', sans-serif;
    font-size: 14px;
    outline: none;
    transition: all 0.2s ease;
    direction: rtl;
    text-align: right;
  }

  .luma-input::placeholder { color: var(--text-muted); }

  .luma-input:focus {
    border-color: rgba(108,99,255,0.5);
    box-shadow: 0 0 0 3px rgba(108,99,255,0.1);
  }

  .luma-send-btn {
    width: 44px; height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #6C63FF, #3ECFCF);
    border: none;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(108,99,255,0.3);
  }

  .luma-send-btn:hover:not(:disabled) {
    transform: scale(1.07);
    box-shadow: 0 6px 24px rgba(108,99,255,0.45);
  }

  .luma-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* BLOCKED BANNER */
  .blocked-banner {
    background: rgba(255,80,80,0.08);
    border: 1px solid rgba(255,80,80,0.25);
    border-radius: 10px;
    padding: 10px 16px;
    color: #FF8080;
    font-size: 13px;
    text-align: center;
    margin: 0 20px 12px;
  }

  /* ANIMATIONS */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  @keyframes typingBounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
    30% { transform: translateY(-6px); opacity: 1; }
  }

  @keyframes msgSlideIn {
    from { opacity: 0; transform: translateY(12px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (max-width: 600px) {
    .luma-page { padding: 0; }
    .luma-shell { height: 100vh; max-height: 100vh; border-radius: 0; }
    .msg-bubble { max-width: 85%; }
  }
`;

function App() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "أهلاً بك في Luma AI! كيف أستطيع مساعدتك اليوم؟",
    },
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (customMessage) => {
    const textToSend = (customMessage || message).trim();
    if (!textToSend) return;

    if (blocked) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "تم إيقاف هذه المحادثة بسبب تكرار استخدام ألفاظ غير لائقة.",
        },
      ]);
      return;
    }

    setMessages((prev) => [...prev, { text: textToSend, sender: "user" }]);
    setMessage("");
    setLoading(true);
    inputRef.current?.focus();

    try {
      const response = await fetch("https://luma-chatbot-green.vercel.app/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, history: messages }),
      });

      const data = await response.json();

      const isRudeReply =
        data.reply && data.reply.includes("لا يمكنني الاستمرار في المحادثة");

      if (isRudeReply) {
        const newCount = warningCount + 1;
        setWarningCount(newCount);

        if (newCount >= 2) {
          setBlocked(true);
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: "تم إيقاف المحادثة بسبب تكرار استخدام ألفاظ غير لائقة.",
            },
          ]);
          setLoading(false);
          return;
        }
      }

      setMessages((prev) => [
        ...prev,
        { text: data.reply, sender: "bot", whatsapp: data.whatsapp },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { text: "حصل خطأ في الاتصال بالسيرفر. حاول مرة ثانية.", sender: "bot" },
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

  const sanitizeAndLinkify = (text) =>
    (text || "").replace(
      /(https?:\/\/[^\s<>"]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

  return (
    <>
      <style>{styles}</style>
      <div className="luma-page">
        <div className="luma-shell">

          {/* TOP BAR */}
          <div className="luma-topbar">
            <div className="luma-brand">
              <div className="luma-brand-icon">
                <LumaIcon />
              </div>
              <div>
                <h1><span>LUMA</span> AI</h1>
                <p>Smart Sales Assistant</p>
              </div>
            </div>
            <div className="luma-status-pill">
              <div className="luma-status-dot" />
              Online
            </div>
          </div>

          {/* HERO CARD */}
          <div className="luma-hero">
            <div className="luma-hero-avatar">
              <LumaIcon />
            </div>
            <div className="luma-hero-text">
              <h2>Luma AI Assistant</h2>
              <p>مساعد ذكي للرد على العملاء وتحويل المهتمين إلى Leads تلقائياً</p>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="luma-quick">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                className="luma-quick-btn"
                onClick={() => sendMessage(q)}
                disabled={loading || blocked}
              >
                {q}
              </button>
            ))}
          </div>

          {/* CHAT MESSAGES */}
          <div className="luma-chatbox">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`msg-row ${msg.sender === "user" ? "user" : "bot"}`}
              >
                {msg.sender === "bot" && (
                  <div className="msg-avatar">
                    <LumaIcon />
                  </div>
                )}
                <div className={`msg-bubble ${msg.sender}`}>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: sanitizeAndLinkify(msg.text),
                    }}
                  />
                  {msg.whatsapp && (
                    <a
                      href={msg.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wa-btn"
                    >
                      <WhatsAppIcon />
                      التقديم عبر واتساب
                    </a>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="typing-row">
                <div className="msg-avatar">
                  <LumaIcon />
                </div>
                <div className="typing-bubble">
                  <TypingIndicator />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* BLOCKED BANNER */}
          {blocked && (
            <div className="blocked-banner">
              تم إيقاف المحادثة بسبب انتهاك سياسة الاستخدام.
            </div>
          )}

          {/* INPUT BAR */}
          <div className="luma-inputbar">
            <button
              className="luma-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || blocked || !message.trim()}
              title="إرسال"
            >
              <SendIcon />
            </button>
            <input
              ref={inputRef}
              className="luma-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك..."
              disabled={loading || blocked}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
          </div>

        </div>
      </div>
    </>
  );
}

export default App;