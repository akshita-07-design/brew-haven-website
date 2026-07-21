import { useState, useEffect, useRef } from "react";
import QuickReplies from "./QuickReplies";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "👋 Welcome to Brew Haven!",
    },
    {
      role: "assistant",
      text: "I'm your AI barista. Ask me anything about our coffee, menu, or recommendations.",
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(customMessage?: string) {
    const userMessage = customMessage ?? input;

    if (!userMessage.trim()) return;

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userMessage,
      },
    ]);

    // Only clear input if typed manually
    if (!customMessage) {
      setInput("");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      console.log("Status:", res.status);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.reply || "Server Error");
      }

      console.log("AI Response:", data);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply,
        },
      ]);
    } catch (err: any) {
      console.error("Chat Error:", err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            err.message ||
            "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          fontSize: 24,
          cursor: "pointer",
          border: "none",
          background: "#8B5E3C",
          color: "white",
          boxShadow: "0 8px 20px rgba(0,0,0,.25)",
          zIndex: 9999,
        }}
      >
        ☕
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 90,
            width: 350,
            height: 520,
            background: "white",
            borderRadius: 16,
            boxShadow: "0 12px 30px rgba(0,0,0,.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: 16,
              background: "#8B5E3C",
              color: "white",
              fontWeight: "bold",
              fontSize: 18,
            }}
          >
            ☕ Brew Haven AI
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 15,
              background: "#fafafa",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 12,
                  textAlign:
                    m.role === "user" ? "right" : "left",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: 14,
                    background:
                      m.role === "user"
                        ? "#8B5E3C"
                        : "#F0F0F0",
                    color:
                      m.role === "user"
                        ? "white"
                        : "#333",
                    lineHeight: 1.5,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div
                style={{
                  color: "#666",
                  fontStyle: "italic",
                  marginTop: 10,
                }}
              >
                ☕ Brew Haven is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <QuickReplies
            onSelect={(text: string) => sendMessage(text)}
            disabled={loading}
          />

          {/* Input */}
          <div
            style={{
              display: "flex",
              padding: 10,
              gap: 8,
              borderTop: "1px solid #eee",
            }}
          >
            <input
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Ask about coffee..."
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                border: "1px solid #ccc",
                outline: "none",
              }}
            />

            <button
              onClick={() => sendMessage()}
              disabled={loading}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "none",
                background: "#8B5E3C",
                color: "white",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}