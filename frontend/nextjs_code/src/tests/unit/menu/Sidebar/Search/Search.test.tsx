// src/tests/unit/menu/Sidebar/Search/Search.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Search from "@/components/menu/Sidebar/Search";

describe("Search component", () => {
	const onChange = jest.fn();
	const onReset = jest.fn();

	beforeEach(() => {
		onChange.mockClear();
		onReset.mockClear();
	});

	it("renders input and placeholder", () => {
		render(<Search query="" onChange={onChange} onReset={onReset} />);
		expect(screen.getByLabelText("Search menu items")).toBeInTheDocument();
	});

	it("calls onChange on typing", () => {
		render(<Search query="" onChange={onChange} onReset={onReset} />);
		fireEvent.change(screen.getByLabelText("Search menu items"), {
			target: { value: "abc" },
		});
		expect(onChange).toHaveBeenCalledWith("abc");
	});

	it("shows reset button when query non-empty and calls onReset", () => {
		render(<Search query="xyz" onChange={onChange} onReset={onReset} />);
		expect(
			screen.getByRole("button", { name: /Reset search/i }),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /Reset search/i }));
		expect(onReset).toHaveBeenCalled();
	});
});
