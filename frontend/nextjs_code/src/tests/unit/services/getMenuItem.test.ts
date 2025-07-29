import { getMenuItems } from "@/service/getMenuItem";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const API_URL = "https://chinocafe.ir/api/menu/item/";

const server = setupServer(
	http.get(API_URL, () => {
		return HttpResponse.json([
			{
				title: "سالاد سزار",
				price: 240,
				category: { title: "پیش غذا" },
			},
		]);
	}),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getMenuItems", () => {
	it("should fetch menu items successfully", async () => {
		const items = await getMenuItems();
		expect(items).toEqual([
			{
				title: "سالاد سزار",
				price: 240,
				category: { title: "پیش غذا" },
			},
		]);
	});

	it("should throw error on failed fetch", async () => {
		server.use(
			http.get(API_URL, () => {
				return new HttpResponse(null, { status: 500 });
			}),
		);

		await expect(getMenuItems()).rejects.toThrow("Failed to fetch menu items");
	});
});
