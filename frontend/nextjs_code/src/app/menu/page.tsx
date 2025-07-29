import { fetchGroupedItems } from "@/lib/menu/fetchGroupedItems";
import CategorySection from "@/components/menu/CategorySection";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

export default async function MenuPage() {
	const { categories, error } = await fetchGroupedItems();

	if (error) {
		return (
			<div className="container mx-auto p-4">
				<div className="bg-red-50 border-l-4 border-red-500 p-4">
					<h3 className="text-red-800 font-bold">خطا</h3>
					<p className="text-red-600">{error}</p>
					<p className="text-sm text-red-500 mt-2">
						لطفا صفحه را رفرش کنید یا با پشتیبانی تماس بگیرید
					</p>
				</div>
			</div>
		);
	}

	if (!categories || categories.length === 0) {
		return (
			<div className="container mx-auto p-4 text-center">
				<p className="text-gray-500">هیچ آیتمی برای نمایش وجود ندارد</p>
			</div>
		);
	}

	return (
		<main className="container mx-auto px-4">
			<div className="space-y-8">
				{categories.map((category) => (
					<CategorySection key={category.title} category={category} />
				))}
			</div>
		</main>
	);
}
