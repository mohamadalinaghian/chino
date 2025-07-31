// app/loading.tsx
import LoadingAnimation from "@/components/LoadingAnimation";

export default function Loading() {
	return (
		<div className="fixed inset-0 bg-#faf3d0 bg-opacity-80 z-50 flex items-center justify-center">
			<LoadingAnimation />
		</div>
	);
}
