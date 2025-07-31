import MenuContainer from "@/components/menu/MenuContainer/MenuContainer.server";

export default function MenuPage() {
	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="text-2xl text-center font-bold mb-8">منو کافه چینو </h1>
			<MenuContainer />
		</main>
	);
}
