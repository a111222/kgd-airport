import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { getThemeSettings, initialTheme } from "@/lib/settings";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "cyrillic"], display: "swap" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KGD — аэропорт Калининграда: онлайн-табло Храброво",
    template: "%s · KGD — аэропорт Калининграда",
  },
  description:
    "Независимый гид по аэропорту Храброво: онлайн-табло вылета и прилёта в реальном времени, статусы рейсов, как добраться, авиабилеты и трансфер.",
  applicationName: "KGD — аэропорт Калининграда",
  openGraph: { type: "website", locale: "ru_RU", siteName: "KGD — аэропорт Калининграда" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef3fa" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Применяет выбор посетителя до первой отрисовки, чтобы не было «мигания» темы.
const themeScript = `(function(){try{var d=document.documentElement;if(d.dataset.policy!=="user")return;var t=localStorage.getItem("kgd-theme");if(t==="warm"||t==="dark")d.dataset.theme=t;}catch(e){}})();`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = await getThemeSettings();
  return (
    <html
      lang="ru"
      data-theme={initialTheme(theme)}
      data-policy={theme.policy}
      className={`${manrope.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
