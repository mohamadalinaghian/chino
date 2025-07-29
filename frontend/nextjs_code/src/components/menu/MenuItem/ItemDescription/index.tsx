import ExpandableText from "./ExpandableText";
import dynamic from "next/dynamic";

const ExpandableToggle = dynamic(() => import("./ExpandableToggle"), {
	ssr: false,
});

export default function ItemDescription({ text }: { text: string }) {
	const shouldShowToggle = text.length > 100;

	return (
		<div className="text-sm text-text-light">
			<ExpandableText text={text} />
			{shouldShowToggle && <ExpandableToggle />}
		</div>
	);
}
