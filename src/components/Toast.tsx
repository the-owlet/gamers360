"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface Toast {
  id: number;
  message: string;
  icon?: string;
  type?: "success" | "error" | "info" | "achievement";
}

interface ToastContextType {
  showToast: (message: string, icon?: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, icon?: string, type: Toast["type"] = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, icon, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const borderColor = (type: Toast["type"]) => {
    switch (type) {
      case "success": return "border-green-500/30";
      case "error": return "border-red-500/30";
      case "achievement": return "border-yellow-500/30";
      default: return "border-cyan-500/30";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 right-4 z-[90] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`glass rounded-xl px-4 py-3 flex items-center gap-3 min-w-[250px] max-w-[350px] border ${borderColor(toast.type)} animate-slide-up pointer-events-auto shadow-2xl`}
          >
            {toast.icon && <span className="text-xl shrink-0">{toast.icon}</span>}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
