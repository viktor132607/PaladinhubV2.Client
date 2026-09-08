import { StatusScaffold } from "@/components/migration/UiScaffolds";
export default function ErrorPage() { return <StatusScaffold title="Request Error" message="An unexpected error occurred while processing the request." tone="error" primaryHref="/" primaryLabel="Go home" />; }
