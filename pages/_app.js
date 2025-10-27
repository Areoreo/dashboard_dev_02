import { useRouter } from "next/router";
import "@styles/globals.scss";

export default function App({ Component, pageProps }) {
    const router = useRouter();

    return <Component {...pageProps} />;
}
