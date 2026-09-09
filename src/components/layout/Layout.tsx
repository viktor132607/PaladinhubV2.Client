import { Outlet } from "@/router/nextCompat";
import { GuidePageHeader } from "@/components/migration/MigratedView";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  return (
    <div className="ph-v1-layout">
      <Navbar />

      <div className="ph-v1-layout-content">
        <GuidePageHeader />
        <main role="main" className="pb-5 container ph-v1-main-container">
          <Outlet />
        </main>
      </div>

      <br />
      <Footer />
    </div>
  );
}
