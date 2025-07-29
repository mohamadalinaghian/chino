// src/tests/unit/menu/Sidebar/CategoryLink.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoryLink from "@/components/menu/Sidebar/CategoryLink";

describe("CategoryLink", () => {
	const onClick = jest.fn();
	const title = "Category A";
	const anchorId = "category-a";

	beforeEach(() => onClick.mockClear());

	it("renders with correct title", () => {
		render(
			<CategoryLink title={title} anchorId={anchorId} onClick={onClick} />,
		);
		expect(screen.getByText(title)).toBeInTheDocument();
	});

	it("calls onClick when clicked", () => {
		render(
			<CategoryLink title={title} anchorId={anchorId} onClick={onClick} />,
		);
		fireEvent.click(screen.getByText(title));
		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
