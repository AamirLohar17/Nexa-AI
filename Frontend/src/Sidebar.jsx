import "./Sidebar.css";
import logo from "./assets/NexaAI.png";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";

function Sidebar({ isMobileOpen = false, onClose = () => {} }) {
  const {
    allThreads,
    setAllThreads,
    currThreadId,
    setNewChat,
    setPrompt,
    setReply,
    setCurrThreadId,
    setPrevChats,
  } = useContext(MyContext);

  const getAllThreads = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/thread`, {
        credentials: "include",
      });

      if (response.status === 401) {
        console.log("Please login to load chat history");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch threads");
      }

      setAllThreads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load threads:", err);
    }
  };

  useEffect(() => {
    getAllThreads();
  }, [currThreadId]);

  const createNewChat = () => {
    setNewChat(true);
    setPrompt("");
    setReply(null);
    setCurrThreadId(uuidv1());
    setPrevChats([]);
    onClose();
  };

  const changeThread = async (newThreadId) => {
    setCurrThreadId(newThreadId);
    onClose();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/thread/${newThreadId}`,
        {
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load chat");
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid chat history response");
      }

      setPrevChats(data);
      setPrompt("");
      setReply(null);
      setNewChat(false);
    } catch (err) {
      console.error("Failed to open chat:", err);
    }
  };

  const deleteThread = async (threadId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/thread/${threadId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.error || "Failed to delete chat");
      }

      setAllThreads((prev) =>
        prev.filter((thread) => thread.threadId !== threadId),
      );

      if (threadId === currThreadId) {
        createNewChat();
      }
    } catch (err) {
      console.error("Failed to delete thread:", err);
    }
  };

  return (
    <section className={`sidebar${isMobileOpen ? " sidebar--open" : ""}`}>
      <div className="sidebarTop">
        <div className="sidebarBrand">
          <img src={logo} alt="NexaAI logo" className="logo" />
          <span>NexaAI</span>
          <button
            className="sidebarClose"
            onClick={onClose}
            aria-label="Close sidebar"
            type="button"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <button className="newChatButton" onClick={createNewChat} type="button">
          <span><i className="fa-solid fa-pen-to-square"></i> New chat</span>
          <span className="newChatShortcut">+</span>
        </button>
      </div>

      <div className="historySection">
        <p className="historyLabel">RECENT CHATS</p>
        <ul className="history">
          {allThreads?.map((thread) => (
            <li
              key={thread.threadId}
              onClick={() => changeThread(thread.threadId)}
              className={thread.threadId === currThreadId ? "highlighted" : ""}
              title={thread.title}
            >
              <span className="threadTitle">{thread.title}</span>
              <button
                type="button"
                className="deleteThreadButton"
                aria-label={`Delete ${thread.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteThread(thread.threadId);
                }}
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="sign">
        <p>Made with <span aria-label="love">♥</span> by Aamir Lohar</p>
      </div>
    </section>
  );
}

export default Sidebar;
