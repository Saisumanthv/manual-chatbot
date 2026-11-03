import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import ReactMarkdown from "react-markdown";
import "./Chat.css";

// Supabase setup (keys come from your .env file)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Chat() {
  const [query, setQuery] = useState("");
  const [chats, setChats] = useState([]); // all rows from the database
  const [pending, setPending] = useState(""); // query shown while waiting for the AI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null); // used to scroll to the latest message

  // Get all rows from Supabase, oldest first
  async function loadChats() {
    const { data, error } = await supabase
      .from("chats")
      .select("id, user_query, ai_response")
      .order("id", { ascending: true });

    if (error) {
      setError("Error: " + error.message);
    } else {
      setChats(data);
    }
  }

  // Load the old messages once when the page opens
  useEffect(() => {
    loadChats();
  }, []);

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, pending]);

  async function handleSend() {
    if (!query.trim() || loading) return;

    const text = query;
    setQuery("");
    setPending(text);
    setLoading(true);
    setError("");

    try {
      // 1. Send the query to your backend
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });

      // 2. If the backend returned 200, reload all rows from Supabase
      if (res.status === 200) {
        await loadChats();
      } else {
        setError("Something went wrong with the /chat request.");
      }
    } catch (err) {
      setError("Request failed: " + err.message);
    } finally {
      setPending("");
      setLoading(false);
    }
  }

  return (
    <div className="chat-container">
      {/* Messages area */}
      <div className="chat-messages">
        {chats.map((chat) => (
          <div key={chat.id} className="chat-row">
            <div className="bubble user-bubble">
              <div className="bubble-label">User</div>
              {chat.user_query}
            </div>
            <div className="bubble ai-bubble">
              <div className="bubble-label">AI</div>
              <ReactMarkdown>{chat.ai_response}</ReactMarkdown>
            </div>
          </div>
        ))}

        {/* Shown while waiting for the AI */}
        {pending && (
          <>
            <div className="bubble user-bubble">
              <div className="bubble-label">User</div>
              {pending}
            </div>
            <div className="bubble ai-bubble">
              <div className="bubble-label">AI</div>
              Thinking...
            </div>
          </>
        )}

        {error && <p className="chat-error">{error}</p>}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask something..."
        />
        <button className="chat-button" onClick={handleSend} disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}