import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "@/components/menu/Sidebar";

describe("Sidebar - Categories", () => {
	const mockCategories = [
		{ title: "Drinks", description: "Beverages" },
		{ title: "Specials", description: null },
	];
	const mockOnClick = jest.fn();

	beforeEach(() => {
		mockOnClick.mockClear();
	});

	it("renders all provided categories when open", () => {
		render(
			<Sidebar
				categories={mockCategories}
				items={[]}
				onCategoryClick={mockOnClick}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));

		mockCategories.forEach((category) => {
			expect(screen.getByText(category.title)).toBeInTheDocument();
		});
	});

	it("calls onCategoryClick with correct id when category is clicked", () => {
		render(
			<Sidebar
				categories={mockCategories}
				items={[]}
				onCategoryClick={mockOnClick}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
		fireEvent.click(screen.getByText("Drinks"));

		expect(mockOnClick).toHaveBeenCalledWith("drinks");
		expect(mockOnClick).toHaveBeenCalledTimes(1);
	});
});
