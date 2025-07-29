import React from "react";
import { render, screen } from "@testing-library/react";
import Sidebar from "@/components/menu/Sidebar";

describe("Sidebar - Rendering", () => {
	const mockCategories = [
		{ title: "Appetizers", description: "Starters menu" },
		{ title: "Main Courses", description: null },
	];

	it("renders toggle button by default", () => {
		render(
			<Sidebar
				categories={mockCategories}
				items={[]}
				onCategoryClick={jest.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: /toggle sidebar/i }),
		).toBeInTheDocument();
	});

	it("does not render sidebar content by default", () => {
		render(
			<Sidebar
				categories={mockCategories}
				items={[]}
				onCategoryClick={jest.fn()}
			/>,
		);

		expect(screen.queryByTestId("sidebar-content")).not.toBeInTheDocument();
	});
});
