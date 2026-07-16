import { useState } from "react";

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
      text: "👋 Hi! I'm Brew Haven AI. Ask me anything about our coffee.",
    },
  ]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = input;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://brew-haven-api.up.railway.app/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I couldn't reach the AI.",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <>
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
            height: 500,
            background: "white",
            borderRadius: 15,
            boxShadow: "0 10px 30px rgba(0,0,0,.2)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              padding: 15,
              fontWeight: "bold",
              borderBottom: "1px solid #ddd",
            }}
          >
            Brew Haven AI
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 15,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 10,
                  textAlign: m.role === "user" ? "right" : "left",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    padding: "10px 14px",
                    borderRadius: 12,
                    background:
                      m.role === "user" ? "#8B5E3C" : "#f3f3f3",
                    color:
                      m.role === "user" ? "white" : "black",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && <p>AI is typing...</p>}
          </div>

          <div
            style={{
              display: "flex",
              padding: 10,
              gap: 8,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                padding: 10,
              }}
              placeholder="Ask about coffee..."
            />

            <button onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}