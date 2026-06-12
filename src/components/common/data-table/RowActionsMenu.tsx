"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { RowAction } from "./types";

const Dots = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 6.75a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 13.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 19.75a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z"
      fill="currentColor"
    />
  </svg>
);

/** Per-row "⋮" action menu — RTL-aware (anchored to the inline-end). */
export default function RowActionsMenu<T>({
  row,
  actions,
  ariaLabel,
}: {
  row: T;
  actions: RowAction<T>[];
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const visible = actions.filter((a) => !a.hidden?.(row));
  if (visible.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
      >
        {Dots}
      </button>
      {open && (
        <div className="absolute end-0 z-40 mt-1 min-w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark">
          {visible.map((a) => {
            const label = typeof a.label === "function" ? a.label(row) : a.label;
            const cls = `flex w-full items-center gap-2 px-4 py-2 text-start text-sm ${
              a.danger
                ? "text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.06]"
            }`;
            const onSelect = (e: React.MouseEvent) => {
              e.stopPropagation();
              setOpen(false);
              a.onClick?.(row);
            };
            return a.href ? (
              <Link key={a.key} href={a.href(row)} className={cls} onClick={() => setOpen(false)}>
                {a.icon}
                {label}
              </Link>
            ) : (
              <button key={a.key} type="button" className={cls} onClick={onSelect}>
                {a.icon}
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
