import React from "react";

/** Card/panel matching the project's existing panel style (see EndpointPreview, settings cards). */
export default function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && (
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
