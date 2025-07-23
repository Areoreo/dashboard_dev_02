import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
    return (
        <Html lang="en" className="scroll-smooth">
            <Head>
                {/* 引入 Google 字体 */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap"
                    rel="stylesheet"
                />
                {/* 引入其他外部 CSS 文件 */}
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css"
                    integrity="sha512-KfkfwYDsLkIlwQp6LFnl8zNdLGxu9YAA1QvwINks4PhcElQSvqcyVLLD9aMhXd13uQjoXtEKNosOWaZqXgel0g=="
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                />
                {/* Import Leaflet */}
                <link
                    rel="stylesheet"
                    href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css"
                />
                {/* <!-- Make sure you put this AFTER Leaflet's CSS --> */}
                <Script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></Script>

                {/* Import font "Noto Sans" from google */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossorigin
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <body>
                <Main />
                <NextScript />
                {/* Load jQuery before any other scripts */}
                <Script
                    src="https://registry.npmmirror.com/jquery/3.7.1/files/dist/jquery.min.js"
                    strategy="beforeInteractive"
                />
            </body>
        </Html>
    );
}
