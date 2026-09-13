import { StatusScaffold } from "@/components/migration/UiScaffolds";

export default function Forbidden() {
  return (
    <StatusScaffold
      title="Access denied"
      message="You do not have permission to open this administrative area."
      tone="error"
      primaryHref="/"
      primaryLabel="Go home"
    />
  );
}
