import { ReactNode } from "react";

type Props = {
  visible: boolean;
  children: ReactNode;
};

export default function FloatingSidebarContainer({ visible, children }: Props) {
  return (
    <nav
      className={`fixed bottom-20 left-2 z-40 bg-[#FAF3E0] text-[#5C4033]
        rounded-xl shadow-xl border border-[#e0d2be]
        transform transition-all duration-300
        ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
        w-fit max-w-[80vw] max-h-[80vh] overflow-y-auto
        scrollbar-thin scrollbar-thumb-[#C4B29E] scrollbar-track-[#f4ede8]`}
    >
      {children}
    </nav>
  );
}
