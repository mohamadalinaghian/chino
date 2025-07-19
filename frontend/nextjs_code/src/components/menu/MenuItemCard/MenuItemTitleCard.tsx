import { highlightText } from "../search/highlight";

interface Props {
  title: string;
  query: string;
}

export default function MenuItemTitle({ title, query }: Props) {
  return (
    <h3 className="text-base font-semibold" itemProp="name">
      {highlightText(title, query)}
    </h3>
  );
}
