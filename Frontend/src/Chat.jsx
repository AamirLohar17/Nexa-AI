import "./Chat.css";
import { useContext, useEffect, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
  const { newChat, prevChats, reply } = useContext(MyContext);
  const [latestReply, setLatestReply] = useState(null);

  useEffect(() => {
    if (reply === null || !prevChats?.length) {
      setLatestReply(null);
      return;
    }

    const lastChat = prevChats[prevChats.length - 1];

    // Animate only the latest assistant response
    if (lastChat?.role !== "assistant" || lastChat.content !== reply) {
      setLatestReply(null);
      return;
    }

    const words = reply.split(" ");
    let idx = 0;

    setLatestReply("");

    const interval = setInterval(() => {
      idx++;
      setLatestReply(words.slice(0, idx).join(" "));

      if (idx >= words.length) {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [reply, prevChats]);

  return (
    <>
      {newChat && <h1>Start a New Chat!</h1>}

      <div className="chats">
        {prevChats?.map((chat, idx) => {
          const isLatestAnimatedReply =
            reply !== null &&
            chat.role === "assistant" &&
            idx === prevChats.length - 1 &&
            chat.content === reply;

          return (
            <div
              className={chat.role === "user" ? "userDiv" : "gptDiv"}
              key={`${idx}-${chat.role}`}
            >
              {chat.role === "user" ? (
                <p className="userMessage">{chat.content}</p>
              ) : (
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {isLatestAnimatedReply && latestReply !== null
                    ? latestReply
                    : chat.content}
                </ReactMarkdown>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default Chat;
