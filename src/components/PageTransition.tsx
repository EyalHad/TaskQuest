import { useRef, useEffect, type ReactNode } from "react";

interface Props {
  pageKey: string;
  children: ReactNode;
}

export function PageTransition({ pageKey, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("page-enter");
    void el.offsetWidth; // force reflow
    el.classList.add("page-enter");
  }, [pageKey]);

  return (
    <div ref={ref} className="page-enter flex-1 min-h-0 overflow-hidden flex flex-col">
      {children}
    </div>
  );
}
