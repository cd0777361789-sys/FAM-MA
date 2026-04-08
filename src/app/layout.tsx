import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { useEffect, useState } from "react";

export const metadata: Metadata = {
  title: "FAM.MA | فام - أزياء ومجوهرات مغربية أصيلة",
  description: "متجر الأزياء والمجوهرات المغربية الراقية - قفاطين، جلابات، مجوهرات أمازيغية - توصيل لجميع المدن المغربية - الدفع عند الاستلام",
  keywords: "ملابس مغربية, قفطان, جلابة, مجوهرات, أزياء, تكشيطة, المغرب, COD",
};

function MetaPixelScript() {
  const [pixel, setPixel] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.meta_pixel) setPixel(data.meta_pixel);
      });
  }, []);

  if (!pixel) return null;

  // Detect if user pasted full code or just ID
  const isId = /^[0-9]{10,}$/.test(pixel.trim());
  if (isId) {
    // Only Pixel ID provided
    return (
      <>
        <script dangerouslySetInnerHTML={{
          __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixel.trim()}');
fbq('track', 'PageView');`
        }} />
        <noscript>
          <img height="1" width="1" style={{display:'none'}} src={`https://www.facebook.com/tr?id=${pixel.trim()}&ev=PageView&noscript=1`} />
        </noscript>
      </>
    );
  }
  // Otherwise, treat as full code
  return <div dangerouslySetInnerHTML={{ __html: pixel }} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <head>
        <MetaPixelScript />
      </head>
      <body className="min-h-full flex flex-col">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
