import React from "react";
import { cn } from "../lib/ui_cn";

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div
      className={cn(
        "rounded-xl2 bg-card shadow-soft ring-1 ring-black/5",
        "backdrop-blur-[2px]",
        className
      )}
      {...rest}
    />
  );
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "ghost" | "danger" }) {
  const { className, tone = "primary", ...rest } = props;

  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm select-none " +
    "transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";

  const tones: Record<string, string> = {
    primary: "bg-ink text-white hover:bg-ink/90",
    ghost: "bg-transparent hover:bg-black/5 text-ink",
    danger: "bg-danger text-white hover:bg-danger/90"
  };

  return <button className={cn(base, tones[tone], className)} {...rest} />;
}

export function Chip({
  tone = "none",
  children
}: {
  tone?: "danger" | "warn" | "ext" | "none";
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    none: "bg-black/5 text-ink/70 ring-black/10",
    danger: "bg-danger/10 text-danger ring-danger/20",
    warn: "bg-warn/10 text-amber-800 ring-warn/25",
    ext: "bg-ext/10 text-ext ring-ext/20"
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs ring-1", map[tone])}>
      {children}
    </span>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={cn(
        "w-full rounded-xl bg-white/70 ring-1 ring-black/10 px-3 py-2 text-sm",
        "focus:ring-2 focus:ring-ext/30 focus:outline-none",
        className
      )}
      {...rest}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      className={cn(
        "w-full rounded-xl bg-white/70 ring-1 ring-black/10 px-3 py-2 text-sm min-h-[84px] resize-y",
        "focus:ring-2 focus:ring-ext/30 focus:outline-none",
        className
      )}
      {...rest}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-muted mb-1">{children}</div>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-ink/80 tracking-tight">{children}</div>;
}
