import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "@/components/menu/Sidebar";

describe("Sidebar - Search Functionality", () => {
	const mockCategories = [
		{ title: "Pizza", description: "Italian pizza" },
		{ title: "Pasta", description: "Italian pasta" },
	];

	it("renders search input when sidebar is open", () => {
		render(
			<Sidebar
				categories={mockCategories}
				items={[]}
				onCategoryClick={jest.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
		expect(screen.getByPlaceholderText(/search items/i)).toBeInTheDocument();
	});

	it("updates search query when typing", () => {
		render(
			<Sidebar
				categories={mockCategories}
				items={[]}
				onCategoryClick={jest.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
		const searchInput = screen.getByPlaceholderText(/search items/i);

		fireEvent.change(searchInput, { target: { value: "pizza" } });
		expect(searchInput).toHaveValue("pizza");
	});
});
