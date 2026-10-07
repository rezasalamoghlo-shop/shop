"use client";

import { useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function SpecialPerfume() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [orderId, setOrderId] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function send() {
    const value = text.trim();
    if (!value || busy || done) return;
    setText("");
    setMessages((items) => [...items, { role: "user", content: value }]);
    setBusy(true);
    try {
      const response = await fetch("/api/special-order/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, message: value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Request failed");
      setOrderId(data.order_id || "");
      setMessages((items) => [
        ...items,
        { role: "assistant", content: data.reply || "درخواست شما ثبت شد." },
      ]);
      setDone(Boolean(data.done));
    } catch {
      setMessages((items) => [
        ...items,
        { role: "assistant", content: "در ثبت پیام مشکلی پیش آمد. لطفاً دوباره تلاش کنید." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="special" className="special-perfume">
      <div className="special-copy">
        <span>GALAXY SPECIAL</span>
        <h2>عطر ویژه خودتان را پیدا کنید.</h2>
        <p>ربات عطر کهکشان چند سؤال کوتاه درباره سلیقه، موقعیت استفاده و رایحه مورد علاقه‌تان می‌پرسد و درخواست شما را برای بررسی تیم ما ثبت می‌کند.</p>
        <div className="special-points">
          <span>✦ رایحه و نت‌های مورد علاقه</span>
          <span>✦ شدت و ماندگاری</span>
          <span>✦ مناسب فصل و موقعیت</span>
        </div>
      </div>
      <div className="special-chat">
        <div className="chat-head"><span>GALAXY BOT</span><b>مشاور عطر ویژه</b></div>
        <div className="chat-body">
          {messages.length === 0 && <div className="bot-message">به بخش عطر ویژه خوش آمدید. برای شروع، بگویید عطر را برای چه کسی می‌خواهید؟</div>}
          {messages.map((message, index) => (
            <div key={index} className={message.role === "user" ? "user-message" : "bot-message"}>{message.content}</div>
          ))}
          {busy && <div className="bot-message typing">در حال آماده‌سازی پاسخ...</div>}
        </div>
        <div className="chat-input">
          <input value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") send(); }} disabled={busy || done} placeholder={done ? "درخواست شما ثبت شد" : "پیام خود را بنویسید..."} />
          <button onClick={send} disabled={busy || done || !text.trim()}>{busy ? "در حال ارسال..." : "ارسال"}</button>
        </div>
      </div>
    </section>
  );
}
