import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { ThemeProvider } from "styled-components";
import GlobalStyle from "@/styles/global";
import { lightTheme } from "@/styles/theme";

export const metadata: Metadata = {
	title: "Chino | Cafe Chino",
	description: "Cafe Chino Site",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="fa">
			<body>
				<I18nextProvider i18n={i18n}>
					<ThemeProvider theme={lightTheme}>
						<GlobalStyle />
						{children}
					</ThemeProvider>
				</I18nextProvider>
			</body>
		</html>
	);
}
