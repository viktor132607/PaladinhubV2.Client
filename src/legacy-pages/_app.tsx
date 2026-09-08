import type { AppProps } from "next/app";
import { AuthProvider } from "@/auth/AuthContext";
import { BrowserRouter as Router } from "@/router/nextCompat";

export default function PagesApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Router>
        <Component {...pageProps} />
      </Router>
    </AuthProvider>
  );
}
