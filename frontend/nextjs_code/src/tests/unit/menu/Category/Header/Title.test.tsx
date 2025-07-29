import { render, screen } from "@testing-library/react";
import Title from "@/components/menu/Category/Header/Title";

describe("Category Title", () => {
	it("renders the title", () => {
		render(<Title>Breakfast</Title>);
		expect(screen.getByText("Breakfast")).toBeInTheDocument();
	});
});
