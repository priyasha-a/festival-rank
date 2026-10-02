"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Request = {
  title: string;
  body?: string;
  confirmLabel: string;
  resolve: (ok: boolean) => void;
};

/**
 * In-app "Are you sure?" dialog (the browser's built-in confirm() is easy to miss and some in-app browsers
 * skip it). Usage: `const { confirm, dialog } = useConfirm();` render `{dialog}`, then
 * `if (await confirm("Remove X?", { body: "…" })) …`.
 */
export function useConfirm() {
  const [request, setRequest] = useState<Request | null>(null);

  const confirm = useCallback(
    (title: string, options: { body?: string; confirmLabel?: string } = {}) =>
      new Promise<boolean>((resolve) =>
        setRequest({ title, body: options.body, confirmLabel: options.confirmLabel ?? "Remove", resolve }),
      ),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      request?.resolve(ok);
      setRequest(null);
    },
    [request],
  );

  const dialog = request ? <Dialog request={request} onClose={close} /> : null;
  return { confirm, dialog };
}

function Dialog({ request, onClose }: { request: Request; onClose: (ok: boolean) => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus Cancel so a stray Enter doesn't delete anything; Escape backs out.
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={() => onClose(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-neutral-900 p-5 ring-1 ring-neutral-700"
      >
        <div className="space-y-1">
          <p id="confirm-title" className="text-lg font-semibold">
            {request.title}
          </p>
          {request.body && <p className="text-sm text-neutral-400">{request.body}</p>}
        </div>
        <div className="flex gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onClose(false)}
            className="flex-1 rounded-full px-4 py-2.5 font-semibold text-neutral-200 ring-1 ring-neutral-700 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onClose(true)}
            className="flex-1 rounded-full bg-red-500 px-4 py-2.5 font-semibold text-white active:scale-95"
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
