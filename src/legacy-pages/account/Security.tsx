import { ActionCardsScaffold } from "@/components/migration/UiScaffolds";

export default function Security() {
  return (
    <ActionCardsScaffold
      title="Security"
      description="Manage your password, two-factor authentication and account recovery options."
      actions={[
        {
          title: "Change password",
          description:
            "Replace your current account password.",
          href: "/Account/ChangePassword",
        },
        {
          title: "Enable 2FA",
          description:
            "Protect your account with an authenticator app.",
          href: "/Account/Enable2FA",
        },
        {
          title: "Recovery codes",
          description:
            "Review your current account recovery codes.",
          href: "/Account/ShowRecoveryCodes",
        },
      ]}
    />
  );
}