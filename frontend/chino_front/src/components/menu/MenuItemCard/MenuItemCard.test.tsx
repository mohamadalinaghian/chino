import { render, screen } from "@testing-library/react";
import MenuItemCard from "./";

const mockItem = {
  title: "قهوه اسپرسو",
  price: 38000,
  description: "این یک توضیح کوتاه است.",
  thumbnail: "/test.jpg",
  category: { title: "قهوه" },
};

describe("MenuItemCard", () => {
  test("renders image, title, and price", () => {
    render(<MenuItemCard item={mockItem} />);
    expect(screen.getByAltText("قهوه اسپرسو")).toBeInTheDocument();
    expect(screen.getByRole("heading")).toHaveTextContent("قهوه اسپرسو");
    expect(screen.getByText("38000")).toBeInTheDocument();
    expect(screen.getByText("هزار تومان")).toBeInTheDocument();
  });
});
