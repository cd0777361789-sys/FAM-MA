import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";

export const metadata: Metadata = {
  title: "FAM.MA | فام - أزياء ومجوهرات مغربية أصيلة",
  description: "متجر الأزياء والمجوهرات المغربية الراقية - قفاطين، جلابات، مجوهرات أمازيغية - توصيل لجميع المدن المغربية - الدفع عند الاستلام",
  keywords: "ملابس مغربية, قفطان, جلابة, مجوهرات, أزياء, تكشيطة, المغرب, COD",
};

import MetaPixelClient from "./MetaPixelClient";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <head />
      <body className="min-h-full flex flex-col">
        <CartProvider>{children}</CartProvider>
        <MetaPixelClient />
      </body>
    </html>
  );
}
