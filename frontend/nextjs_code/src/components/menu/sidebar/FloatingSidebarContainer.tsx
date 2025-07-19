import { ReactNode } from "react";

type Props = {
  visible: boolean;
  children: ReactNode;
};

export default function FloatingSidebarContainer({ visible, children }: Props) {
  return (
    <nav
      className={`fixed bottom-15 left-0 z-40 p-4 bg-white rounded-xl shadow-lg transition-all duration-300 transform
        ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
        w-auto max-w-[200px]`}
    >
      {children}
    </nav>
  );
}
