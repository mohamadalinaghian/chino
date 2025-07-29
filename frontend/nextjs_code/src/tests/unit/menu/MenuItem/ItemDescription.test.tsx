import { render, screen, fireEvent } from "@testing-library/react";
import ItemDescription from "@/components/menu/MenuItem/ItemDescription";

describe("ItemDescription", () => {
	it("should render description", () => {
		render(<ItemDescription text="Test description" />);
		expect(screen.getByText("Test description")).toBeInTheDocument();
	});
});
