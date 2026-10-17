import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "لعبة الطاولة الذكية | Board Game MVP",
  description: "العب مع أصدقائك بلعبة طاولة مخصصة بالذكاء الاصطناعي"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
