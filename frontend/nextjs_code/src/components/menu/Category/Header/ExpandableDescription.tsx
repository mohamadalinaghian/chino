import dynamic from "next/dynamic";
import ExpandableText from "@/components/menu/MenuItem/ItemDescription/ExpandableText";

const ExpandableToggle = dynamic(
	() =>
		import("@/components/menu/MenuItem/ItemDescription/ExpandableToggleClient"),
	{ ssr: false },
);

export default function ExpandableDescription({ text }: { text: string }) {
	const shouldToggle = text.length > 100;

	return (
		<div className="mt-1 text-sm text-text-light">
			<ExpandableText text={text} maxLength={100} />
			{shouldToggle && <ExpandableToggle />}
		</div>
	);
}
