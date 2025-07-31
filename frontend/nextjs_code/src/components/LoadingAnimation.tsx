"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";

const Lottie = dynamic(() => import("lottie-react"), {
	ssr: false,
	loading: () => (
		<div className="w-[300px] h-[300px] bg-gray-100 rounded"></div>
	),
});

export default function LoadingAnimation() {
	return (
		<div className="flex flex-col items-center justify-center">
			<Lottie
				animationData={require("../../public/loading.json")}
				loop={true}
				autoplay={true}
				style={{ width: 300, height: 300 }}
			/>
		</div>
	);
}
