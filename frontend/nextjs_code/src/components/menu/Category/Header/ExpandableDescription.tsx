// src/components/menu/Category/Header/ExpandableDescription.tsx
import ExpandableText from "@/components/menu/MenuItem/ItemDescription/ExpandableText";

export default function ExpandableDescription({ text }: { text: string }) {
	const shouldToggle = text.length > 100;

	return (
		<div className="mt-1 text-sm text-text-light">
			<ExpandableText text={text} />
			{shouldToggle && <button data-testid="expand-toggle">Read more</button>}
		</div>
	);
}
