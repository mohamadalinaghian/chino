import { getCategories } from "@/service/getCategory";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const API_URL = "https://chinocafe.ir/api/menu/category/";

const server = setupServer(
	http.get(API_URL, () => {
		return HttpResponse.json([
			{ title: "پیش غذا و سالاد", description: "توضیحات دسته" },
		]);
	}),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getCategories", () => {
	it("should fetch categories successfully", async () => {
		const categories = await getCategories();
		expect(categories).toEqual([
			{ title: "پیش غذا و سالاد", description: "توضیحات دسته" },
		]);
	});

	it("should throw error on failed fetch", async () => {
		server.use(
			http.get(API_URL, () => {
				return new HttpResponse(null, { status: 500 });
			}),
		);

		await expect(getCategories()).rejects.toThrow("Failed to fetch categories");
	});
});
