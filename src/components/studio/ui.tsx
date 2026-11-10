import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type V = "primary" | "ghost" | "outline" | "danger";
const variants: Record<V, string> = {
  primary:
    "brand-gradient text-primary-foreground shadow-[0_0_20px_-6px_var(--primary)] hover:brightness-110",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-accent",
  outline: "border border-border text-foreground hover:bg-accent",
  danger: "bg-destructive text-destructive-foreground hover:opacity-90",
};

export function Btn({
  variant = "ghost",
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: V }) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 h-9 text-sm font-medium transition disabled:opacity-40 disabled:pointer-events-none",
        variants[variant],
        className,
      )}
    />
  );
}
