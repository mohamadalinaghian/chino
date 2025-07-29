// src/tests/unit/menu/MenuItem/ItemCard.test.tsx
import { render, screen } from "@testing-library/react";
import ItemCard from "@/components/menu/MenuItem";

describe("ItemCard", () => {
	it("should render item card", () => {
		render(
			<ItemCard
				title="Test Title"
				price={10000}
				description="Test Description"
				thumbnail="/test.jpg"
			/>,
		);

		// بررسی عنوان
		expect(screen.getByText("Test Title")).toBeInTheDocument();
		// بررسی قیمت
		expect(screen.getByText("10,000 هزار تومان")).toBeInTheDocument();
		// بررسی توضیحات
		expect(screen.getByText("Test Description")).toBeInTheDocument();
	});
});
