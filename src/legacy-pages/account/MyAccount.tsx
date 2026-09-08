import { ActionCardsScaffold } from "@/components/migration/UiScaffolds";

export default function MyAccount() {
  return (
    <ActionCardsScaffold
      title="Account Overview"
      description="Manage your PaladinHub profile, security and purchases."
      actions={[
        {
          title: "Account details",
          description:
            "Update your name, email and phone number.",
          href: "/Account/AccountDetails",
        },
        {
          title: "Security",
          description:
            "Manage your password, two-factor authentication and recovery options.",
          href: "/Account/Security",
        },
        {
          title: "Payment methods",
          description:
            "Manage saved cards and billing preferences.",
          href: "/Account/PaymentMethods",
        },
        {
          title: "Transaction history",
          description:
            "Review recent purchases and wallet activity.",
          href: "/Account/TransactionHistory",
        },
      ]}
    />
  );
}