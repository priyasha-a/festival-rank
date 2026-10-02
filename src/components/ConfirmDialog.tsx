"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Request = {
  title: string;
  body?: string;
  confirmLabel: string;
  /** The button that was tapped; the popover appears next to it. */
  anchor?: HTMLElement;
  resolve: (ok: boolean) => void;
};

/**
 * Small "Are you sure?" popover shown right next to the button that was tapped (no dimming), replacing the
 * browser's confirm() box, which is easy to miss and skipped by some in-app browsers.
 * Usage: `const { confirm, dialog } = useConfirm();` render `{dialog}`, then
 * `if (await confirm("Remove X?", { anchor: e.currentTarget })) …`.
 */
export function useConfirm() {
  const [request, setRequest] = useState<Request | null>(null);

  const confirm = useCallback(
    (title: string, options: { body?: string; confirmLabel?: string; anchor?: HTMLElement } = {}) =>
      new Promise<boolean>((resolve) =>
        setRequest({
          title,
          body: options.body,
          confirmLabel: options.confirmLabel ?? "Remove",
          anchor: options.anchor,
          resolve,
        }),
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

  const dialog = request ? <Popover request={request} onClose={close} /> : null;
  return { confirm, dialog };
}

const WIDTH = 256; // px
const GAP = 6; // px between the button and the popover
const MARGIN = 8; // px from the screen edges

function Popover({ request, onClose }: { request: Request; onClose: (ok: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<React.CSSProperties>({ visibility: "hidden" });

  // Place it under the tapped button, right-aligned to it; flip above if it would run off the bottom.
  useLayoutEffect(() => {
    const height = ref.current?.offsetHeight ?? 0;
    const rect = request.anchor?.getBoundingClientRect();
    if (!rect) {
      setPosition({ left: (window.innerWidth - WIDTH) / 2, top: (window.innerHeight - height) / 2 });
      return;
    }
    const left = Math.min(Math.max(rect.right - WIDTH, MARGIN), window.innerWidth - WIDTH - MARGIN);
    const below = rect.bottom + GAP;
    const top = below + height > window.innerHeight - MARGIN ? rect.top - GAP - height : below;
    setPosition({ left, top: Math.max(top, MARGIN) });
  }, [request.anchor]);

  useEffect(() => {
    // Focus Cancel so a stray Enter doesn't delete anything; Escape or scrolling backs out.
    cancelRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(false);
    const onScroll = () => onClose(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [onClose]);

  return (
    // Invisible layer so tapping anywhere else cancels; nothing is dimmed or blurred.
    <div className="fixed inset-0 z-50" onClick={() => onClose(false)}>
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        style={{ ...position, width: WIDTH }}
        className="fixed space-y-2.5 rounded-xl bg-neutral-800 p-3 shadow-xl shadow-black/50 ring-1 ring-neutral-700"
      >
        <div>
          <p id="confirm-title" className="text-sm font-semibold">
            {request.title}
          </p>
          {request.body && <p className="text-xs text-neutral-400">{request.body}</p>}
        </div>
        <div className="flex gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onClose(false)}
            className="flex-1 rounded-full px-3 py-1.5 text-sm font-medium text-neutral-200 ring-1 ring-neutral-600 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onClose(true)}
            className="flex-1 rounded-full bg-red-500 px-3 py-1.5 text-sm font-semibold text-white active:scale-95"
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
