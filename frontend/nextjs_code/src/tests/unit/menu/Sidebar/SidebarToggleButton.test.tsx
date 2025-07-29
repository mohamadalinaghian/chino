import { render, screen, fireEvent } from "@testing-library/react";
import SidebarToggleButton from "@/components/menu/Sidebar/SidebarToggleButton";

describe("SidebarToggleButton", () => {
	it("renders menu icon when closed", () => {
		render(<SidebarToggleButton isOpen={false} onToggle={() => {}} />);
		expect(screen.getByRole("button")).toHaveTextContent("☰");
	});

	it("renders close icon when open", () => {
		render(<SidebarToggleButton isOpen={true} onToggle={() => {}} />);
		expect(screen.getByRole("button")).toHaveTextContent("×");
	});

	it("calls onToggle when clicked", () => {
		const mock = jest.fn();
		render(<SidebarToggleButton isOpen={false} onToggle={mock} />);
		fireEvent.click(screen.getByRole("button"));
		expect(mock).toHaveBeenCalledTimes(1);
	});
});
