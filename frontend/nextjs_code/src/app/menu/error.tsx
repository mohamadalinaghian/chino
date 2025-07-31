"use client";

import { useEffect } from "react";
import Image from "next/image";

interface MenuErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

/**
 * Error Boundary for Menu Page
 * - Catches all errors in the menu route
 * - Provides error recovery mechanism
 * - Accessible design with ARIA labels
 */
export default function MenuError({ error, reset }: MenuErrorProps) {
	useEffect(() => {
		// Log error to error reporting service
		console.error("Menu error:", error);
	}, [error]);

	return (
		<main
			className="flex flex-col items-center justify-center p-6 text-center min-h-[60vh]"
			aria-labelledby="menu-error-heading"
			role="alert"
		>
			<div className="mb-6">
				<Image
					src="/error-icon.svg"
					alt="خطا"
					width={80}
					height={80}
					className="mx-auto"
				/>
			</div>

			<h2
				id="menu-error-heading"
				className="text-2xl font-semibold text-red-600 mb-4"
			>
				مشکلی در بارگذاری منو پیش آمد
			</h2>

			<p className="mb-6 text-gray-700 max-w-md">
				{process.env.NODE_ENV === "development"
					? error.message
					: "در بارگذاری منو مشکلی رخ داد. لطفا اتصال خود را بررسی کنید و مجددا تلاش کنید."}
			</p>

			<button
				onClick={() => reset()}
				className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
				aria-label="تلاش مجدد برای بارگذاری منو"
			>
				تلاش مجدد
			</button>
		</main>
	);
}
