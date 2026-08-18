import { StatusScaffold } from "@/components/migration/UiScaffolds";
export default function ServerError() { return <StatusScaffold title="Server Error" message="The server could not complete the request." tone="error" primaryHref="/" primaryLabel="Go home" />; }
