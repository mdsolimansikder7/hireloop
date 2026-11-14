"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; message: string; kind: ToastKind };
type ToastContextValue = {
  showToast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const styles: Record<ToastKind, { icon: typeof CheckCircle2; color: string }> = {
  success: { icon: CheckCircle2, color: "text-emerald-300" },
  error: { icon: AlertCircle, color: "text-rose-300" },
  info: { icon: Info, color: "text-sky-300" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const cleanMessage = message.trim();
      if (!cleanMessage) return;
      const id = ++nextId.current;
      setToasts((current) => [...current.slice(-3), { id, message: cleanMessage, kind }]);
      timers.current.set(
        id,
        setTimeout(() => dismissToast(id), 4000),
      );
    },
    [dismissToast],
  );

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed left-1/2 top-4 z-[100] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col items-center gap-2"
      >
        {toasts.map((toast) => {
          const { icon: Icon, color } = styles[toast.kind];
          return (
            <div
              key={toast.id}
              role={toast.kind === "error" ? "alert" : "status"}
              aria-live={toast.kind === "error" ? "assertive" : "polite"}
              className="pointer-events-auto flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[#18181d] px-4 py-3 text-sm text-white shadow-2xl shadow-black/40 animate-in fade-in slide-in-from-top-2"
            >
              <Icon className={`size-4 shrink-0 ${color}`} aria-hidden="true" />
              <span className="min-w-0 flex-1 text-[13px] leading-5">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded p-1 text-[#8c8c96] transition hover:bg-white/10 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
