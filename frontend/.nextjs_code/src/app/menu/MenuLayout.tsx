import { ReactNode } from "react";

export default function MenuLayout({
  sidebar,
  content,
}: {
  sidebar: ReactNode;
  content: ReactNode;
}) {
  return (
    <div className="flex flex-col ">
      <aside className="w-full md:w-1/4">{sidebar}</aside>
      <section className="flex-1">{content}</section>
    </div>
  );
}
