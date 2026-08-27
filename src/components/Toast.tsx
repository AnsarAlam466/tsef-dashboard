"use client";

import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext<(msg: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<{ id: number; text: string }[]>([]);

  const showToast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setMessages((m) => [...m, { id, text }]);
    setTimeout(() => setMessages((m) => m.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className="rounded-lg border border-[#2E3A32] bg-[#2C3830] px-4 py-3 text-sm text-[#F2EFE4] shadow-lg"
          >
            {m.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
