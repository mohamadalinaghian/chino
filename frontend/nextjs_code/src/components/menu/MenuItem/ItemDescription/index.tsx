import DescriptionText from "./DescriptionText";
import ExpandButton from "./ExpandButton";
import { useState } from "react";
interface Props {
	text: string;
	maxLines?: number;
}
export default function ItemDescription({ text, maxLines = 1 }: Props) {
	const [expanded, setExpanded] = useState(false);
	return (
		<div className="space-y-1">
			<DescriptionText text={text} maxLines={maxLines} expanded={expanded} />
			<ExpandButton
				text={text}
				maxLines={maxLines}
				onExpandChange={setExpanded}
			/>
		</div>
	);
}
