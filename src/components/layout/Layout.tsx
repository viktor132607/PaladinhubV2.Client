import { Outlet } from "@/router/nextCompat";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white">
      <Navbar />

      <div className="pt-[80px]">
        <main
          className="
            mx-auto w-full px-3 pb-12

            min-[576px]:max-w-[540px]
            min-[768px]:max-w-[720px]
            min-[992px]:max-w-[960px]
            min-[1200px]:max-w-[1140px]
            min-[1400px]:max-w-[1320px]
          "
        >
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
}