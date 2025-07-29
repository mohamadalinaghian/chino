import { render, screen } from "@testing-library/react";
import ExpandableDescription from "@/components/menu/Category/Header/ExpandableDescription";

jest.mock(
	"@/components/menu/MenuItem/ItemDescription/ExpandableToggle",
	() => () => <button data-testid="expand-toggle">Read more</button>,
);

describe("ExpandableDescription", () => {
	it("renders short text without toggle", () => {
		render(<ExpandableDescription text="Short description" />);
		expect(screen.getByText("Short description")).toBeInTheDocument();
		expect(screen.queryByTestId("expand-toggle")).not.toBeInTheDocument();
	});

	it("renders long text with toggle", () => {
		const longText =
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(3);
		render(<ExpandableDescription text={longText} />);
		expect(screen.getByText(/Lorem ipsum/)).toBeInTheDocument();
		expect(screen.getByTestId("expand-toggle")).toBeInTheDocument();
	});
});
