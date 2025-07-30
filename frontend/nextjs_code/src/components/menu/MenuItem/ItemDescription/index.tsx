import ExpandableText from "./ExpandableText";
import ExpandableToggle from "./ExpandableToggle";

export default function ItemDescription({ text }: { text: string }) {
	const shouldShowToggle = text.length > 100;

	return (
		<div className="text-sm text-text-light">
			<ExpandableText text={text} />
			{shouldShowToggle && <ExpandableToggle />}
		</div>
	);
}
