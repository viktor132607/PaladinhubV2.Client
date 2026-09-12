"use client";
import { useLocalization } from "@/localization/LocalizationContext";
export default function Footer() {
  const { t } = useLocalization();
  return (
    <footer className="border-top footer text-muted text-center mt-5 py-3 ph-v1-footer">
      <div className="container">
        © {new Date().getFullYear()} - PaladinHub | {t("Made with 💛 for WoW Paladins")}
      </div>
    </footer>
  );
}
