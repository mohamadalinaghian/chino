import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";
import "whatwg-fetch";

// Polyfill برای APIهای مورد نیاز
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

if (typeof global.BroadcastChannel === "undefined") {
	class MockBroadcastChannel {
		name: string;
		constructor(name: string) {
			this.name = name;
		}
		postMessage() {}
		close() {}
		onmessage() {}
	}
	global.BroadcastChannel = MockBroadcastChannel as any;
}

if (typeof global.TransformStream === "undefined") {
	const { TransformStream } = require("web-streams-polyfill");
	global.TransformStream = TransformStream;
}

// Mock برای محیط Next.js
process.env = {
	...process.env,
	NEXT_PUBLIC_API_URL: "https://chinocafe.ir",
	NEXT_FETCH_REVALIDATE: "60",
};
