import { useState, useRef, useEffect } from "react";
import { MessageCircleQuestion, X, Send } from "lucide-react";
import * as chatbotService from "../services/chatbotService";

const GREETING = "Hi! I'm the SmartStay assistant. Ask me about hostel life, how matching works, or anything roommate-related.";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", text: GREETING }]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);

    try {
      // Send the prior turns as history (excluding the greeting, which has no user counterpart yet)
      const history = messages.slice(1);
      const data = await chatbotService.sendChatbotMessage(text, history);
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <span style={{ fontWeight: 600 }}>Hostel assistant</span>
            <button className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          <div className="chatbot-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble-row ${m.role === "user" ? "mine" : "theirs"}`}>
                <div className="chat-bubble">{m.text}</div>
              </div>
            ))}
            {sending && (
              <div className="chat-bubble-row theirs">
                <div className="chat-bubble muted">Typing…</div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="chatbot-input-row">
            <input
              placeholder="Ask about hostel life…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" className="btn btn-gold chatbot-send-btn" disabled={sending || !draft.trim()} aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button className="chatbot-fab" onClick={() => setOpen((o) => !o)} aria-label="Open hostel assistant">
        {open ? <X size={22} /> : <MessageCircleQuestion size={22} />}
      </button>
    </>
  );
}
