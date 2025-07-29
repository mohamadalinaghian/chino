// src/tests/unit/menu/MenuItem/ItemPrice.test.tsx
import { render, screen } from "@testing-library/react";
import ItemPrice from "@/components/menu/MenuItem/ItemPrice";

describe("ItemPrice", () => {
	it("should format and display the price correctly", () => {
		const testPrice = 125000;
		render(<ItemPrice price={testPrice} />);

		const priceText = screen.getByText(/هزار تومان/);
		expect(priceText).toBeInTheDocument();
		expect(priceText.textContent).toContain("125,000");
		expect(priceText).toHaveClass("text-secondary", "font-medium");
	});

	it("should handle zero price", () => {
		render(<ItemPrice price={0} />);
		expect(screen.getByText(/0 هزار تومان/)).toBeInTheDocument();
	});
});
