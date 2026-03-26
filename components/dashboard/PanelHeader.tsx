import React from "react";

type Props = {
  title: string;
  value?: string;
  delta?: string;
  deltaTone?: "green" | "red" | "neutral";
  children?: React.ReactNode;
};

export function PanelHeader({ title, value, delta, deltaTone = "neutral", children }: Props) {
  const deltaColor =
    deltaTone === "green"
      ? "text-success"
      : deltaTone === "red"
        ? "text-danger"
        : "text-txt-muted";

  return (
    <div className="flex h-[46px] shrink-0 items-center gap-2 border-b border-border px-3.5">
      <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-txt-muted">
        {title}
      </span>
      {value && (
        <span className="font-sans text-[12px] tabular-nums text-txt-primary">{value}</span>
      )}
      {delta && (
        <span className={`font-sans text-[14px] tabular-nums ${deltaColor}`}>{delta}</span>
      )}
      <span className="flex-1" />
      {children}
    </div>
  );
}
