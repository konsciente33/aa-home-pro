import { useEffect, useRef, useState } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbzjznc0s5r8WB19L5IBOVtBx78y337B1_nhNsFpsrrbE4RaH3MZ0zKJfHUlXKIB_DmS/exec";

export default function ChatModal({ job, currentUser, onClose }) {
  const activeJobId = String(job?.id || "").trim();
  const currentName = String(currentUser?.name || "")
    .trim()
    .toLowerCase();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const listRef = useRef(null);
  const audioRef = useRef(null);
  const previousLastMessageRef = useRef("");

  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.mp3");
    audioRef.current.volume = 1;
  }, []);

  const playNotification = async () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      }
    } catch (err) {
      console.log("No se pudo reproducir el sonido");
    }
  };

  const unlockAudio = async () => {
    if (!audioRef.current) return;

    try {
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } catch (err) {
      console.log("Audio bloqueado por navegador hasta interacción");
    }
  };

  const formatTime = (value) => {
    if (!value) return "";

    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      const now = new Date();
      const sameDay =
        parsed.getDate() === now.getDate() &&
        parsed.getMonth() === now.getMonth() &&
        parsed.getFullYear() === now.getFullYear();

      const timeText = parsed.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });

      return sameDay
        ? `Hoy · ${timeText}`
        : `${parsed.toLocaleDateString()} · ${timeText}`;
    }

    return String(value);
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  };

  const triggerIncomingAlert = async () => {
    setShowAlert(true);
    await playNotification();

    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    setTimeout(() => {
      setShowAlert(false);
    }, 2200);
  };

  const loadMessages = async (isInitial = false) => {
    if (!activeJobId) return;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "getMessages",
          jobId: activeJobId,
        }),
      });

      const data = await res.json();
      const newMessages = Array.isArray(data) ? data : [];

      const newest =
        newMessages.length > 0 ? newMessages[newMessages.length - 1] : null;
      const newestSignature = newest
        ? `${newest.user || ""}|${newest.message || ""}|${newest.time || ""}`
        : "";

      if (
        !isInitial &&
        newestSignature &&
        newestSignature !== previousLastMessageRef.current
      ) {
        const newestUser = String(newest?.user || "")
          .trim()
          .toLowerCase();

        if (newestUser && newestUser !== currentName) {
          await triggerIncomingAlert();
        }
      }

      previousLastMessageRef.current = newestSignature;
      setMessages(newMessages);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  useEffect(() => {
    unlockAudio();
    loadMessages(true);

    const timer = setInterval(() => {
      loadMessages(false);
    }, 4000);

    return () => clearInterval(timer);
  }, [activeJobId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const cleanText = String(text || "").trim();

    if (!cleanText || !activeJobId || !currentName || sending) return;

    setSending(true);
    await unlockAudio();

    const optimisticMessage = {
      jobId: activeJobId,
      user: currentUser.name,
      message: cleanText,
      time: new Date().toISOString(),
      _tempId: Date.now(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setText("");
    scrollToBottom();

    // sonido al enviar tú mismo
    await playNotification();

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "addMessage",
          jobId: activeJobId,
          user: currentUser.name,
          message: cleanText,
        }),
      });

      const result = await res.json();

      if (!result?.success) {
        console.error("Message not saved:", result);
      }

      await loadMessages(false);
    } catch (err) {
      console.error("Error sending message:", err);
      await loadMessages(false);
    }

    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-overlay" onClick={unlockAudio}>
      <div className="chat-box" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <span>{job?.client ? `${job.client} Chat` : "Job Chat"}</span>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        {showAlert && <div className="chat-alert">New message</div>}

        <div className="chat-messages" ref={listRef}>
          {messages.length === 0 && (
            <div className="chat-empty">No messages yet.</div>
          )}

          {messages.map((m, i) => {
            const mine =
              String(m.user || "")
                .trim()
                .toLowerCase() === currentName;

            return (
              <div
                key={m._tempId || `${m.time || "t"}-${i}`}
                className={`chat-row ${mine ? "mine" : ""}`}
              >
                <div className="chat-bubble">
                  <strong>{m.user}</strong>
                  <div>{m.message}</div>
                  <small>{formatTime(m.time)}</small>
                </div>
              </div>
            );
          })}
        </div>

        <div className="chat-input">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={unlockAudio}
            placeholder="Type message..."
            disabled={sending}
          />
          <button type="button" onClick={sendMessage} disabled={sending}>
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
