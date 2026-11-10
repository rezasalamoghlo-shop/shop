"use client";

import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json().catch(() => null);

      if (response.ok) {
        window.location.assign("/admin");
        return;
      }

      setError(
        result?.error ||
          (response.status === 401
            ? "نام کاربری یا رمز عبور نادرست است."
            : "ورود انجام نشد. لطفاً دوباره تلاش کنید.")
      );
    } catch {
      setError("ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login">
      <div className="login-card">
        <span>GALAXY ADMIN</span>
        <h1>ورود صاحب فروشگاه</h1>
        <p>مدیریت محصولات، ویترین و سفارش‌ها</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <input
            autoComplete="username"
            placeholder="نام کاربری"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <input
            autoComplete="current-password"
            type="password"
            placeholder="رمز عبور"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <small role="alert">{error}</small>}
          <button className="gold full" type="submit" disabled={busy}>
            {busy ? "در حال بررسی..." : "ورود"}
          </button>
        </form>
        <a href="/">بازگشت به فروشگاه</a>
      </div>
    </main>
  );
}
