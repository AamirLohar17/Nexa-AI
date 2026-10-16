import "./Sidebar.css";
import logo from "./assets/NexaAI.png";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";

function Sidebar() {
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
  };

  const changeThread = async (newThreadId) => {
    setCurrThreadId(newThreadId);

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
      console.log(res);

      //updated threads re-render
      setAllThreads((prev) =>
        prev.filter((thread) => thread.threadId !== threadId),
      );

      if (threadId === currThreadId) {
        createNewChat();
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <section className="sidebar">
      <button onClick={createNewChat}>
        <img src={logo} alt="AI logo" className="logo" />
        <span>
          <i className="fa-solid fa-pen-to-square"></i>
        </span>
      </button>

      <ul className="history">
        {allThreads?.map((thread, idx) => (
          <li
            key={idx}
            onClick={(e) => changeThread(thread.threadId)}
            className={thread.threadId === currThreadId ? "highlighted" : " "}
          >
            {thread.title}
            <i
              className="fa-solid fa-trash"
              onClick={(e) => {
                e.stopPropagation(); //stop event bubbling
                deleteThread(thread.threadId);
              }}
            ></i>
          </li>
        ))}
      </ul>

      <div className="sign">
        <p>By Aamir Lohar &hearts;</p>
      </div>
    </section>
  );
}

export default Sidebar;
