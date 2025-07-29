// src/tests/unit/menu/MenuItem/ItemThumbnail.test.tsx

import { render, screen } from "@testing-library/react";
import ItemThumbnail from "@/components/menu/MenuItem/ItemThumbnail";

describe("ItemThumbnail", () => {
	it("should render image when src is provided", () => {
		render(<ItemThumbnail src="/test.jpg" alt="Test" />);
		const image = screen.getByAltText("Test");
		expect(image).toBeInTheDocument();
		expect(image).toHaveAttribute("src", "/test.jpg");
		expect(image).toHaveAttribute("alt", "Test");
	});
});
