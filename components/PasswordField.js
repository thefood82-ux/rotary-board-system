"use client";

import { useState } from "react";

export default function PasswordField(props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="password-toggle"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? "숨기기" : "보기"}
      </button>
    </div>
  );
}
