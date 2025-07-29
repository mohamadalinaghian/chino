import { render, screen } from "@testing-library/react";
import Category from "@/components/menu/Category";

describe("Category", () => {
	it("renders category title and items", () => {
		render(
			<Category
				title="Pizza"
				description="Delicious stone oven pizzas"
				items={[
					{
						title: "Margherita",
						price: 100,
						description: "Classic pizza with tomatoes and cheese",
						thumbnail: "/pizza.jpg",
					},
				]}
			/>,
		);

		expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
			"Pizza",
		);
		expect(screen.getByText("Margherita")).toBeInTheDocument();
		expect(screen.getByText(/100/)).toBeInTheDocument();
	});
});
