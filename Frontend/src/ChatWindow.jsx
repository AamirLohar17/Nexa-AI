import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect } from "react";
import { RingLoader } from "react-spinners";

function ChatWindow({ onMenuClick = () => {} }) {
  const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setPrevChats,
    setNewChat,
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");

  const getReply = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError("");
    setNewChat(false);

    const message = prompt.trim();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          threadId: currThreadId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response");
      }

      setReply(data.reply);
    } catch (err) {
      console.error("Chat error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prompt && reply) {
      setPrevChats((prevChats) => [
        ...prevChats,
        { role: "user", content: prompt },
        { role: "assistant", content: reply },
      ]);
      setPrompt("");
    }
  }, [reply]);

  const handleProfileClick = () => {
    setIsOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Logout failed");
      }

      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
      setError("Logout failed. Please try again.");
    }
  };

  return (
    <main className="chatWindow">
      <header className="navbar">
        <div className="navbarLeft">
          <button
            type="button"
            className="mobileMenuButton"
            onClick={onMenuClick}
            aria-label="Open chat history"
          >
            <i className="fa-solid fa-bars"></i>
          </button>
          <span className="navbarTitle">NexaAI <span className="titleDot">•</span></span>
        </div>

        <button
          type="button"
          className="userIconDiv"
          onClick={handleProfileClick}
          aria-label="Open profile menu"
          aria-expanded={isOpen}
        >
          <span className="userIcon"><i className="fa-solid fa-user"></i></span>
        </button>
      </header>

      {isOpen && (
        <>
          <button
            type="button"
            className="dropdownBackdrop"
            aria-label="Close profile menu"
            onClick={() => setIsOpen(false)}
          />
          <div className="dropDown">
            <div className="dropDownItem">
              <i className="fa-solid fa-gear"></i> Settings
            </div>
            <div className="dropDownItem">
              <i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan
            </div>
            <button type="button" className="dropDownItem" onClick={handleLogout}>
              <i className="fa-solid fa-arrow-right-from-bracket"></i> Log out
            </button>
          </div>
        </>
      )}

      <Chat />

      <div className="loadingArea">
        <RingLoader color="#a5b4fc" loading={loading} size={32} />
      </div>

      {error && <p className="authError chatError">{error}</p>}

      <div className="chatInput">
        <form
          className="inputBox"
          onSubmit={(e) => {
            e.preventDefault();
            getReply();
          }}
        >
          <input
            aria-label="Message NexaAI"
            placeholder="Message NexaAI..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
          <button id="submit" type="submit" title="Send message" aria-label="Send message" disabled={loading || !prompt.trim()}>
            <i className="fa-solid fa-arrow-up"></i>
          </button>
        </form>
        <p className="info">NexaAI can make mistakes. Check important information.</p>
      </div>
    </main>
  );
}

export default ChatWindow;
