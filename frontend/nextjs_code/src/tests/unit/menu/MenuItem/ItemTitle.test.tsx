import { render, screen } from "@testing-library/react";
import ItemTitle from "@/components/menu/MenuItem/ItemTitle";

describe("ItemTitle", () => {
	it("should render the title correctly", () => {
		const testTitle = "Test Menu Item";
		render(<ItemTitle>{testTitle}</ItemTitle>);

		const titleElement = screen.getByRole("heading", { level: 3 });
		expect(titleElement).toBeInTheDocument();
		expect(titleElement).toHaveTextContent(testTitle);
		expect(titleElement).toHaveClass("text-lg", "font-bold", "text-text");
	});
});
