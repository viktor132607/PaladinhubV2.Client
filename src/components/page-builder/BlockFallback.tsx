
export type BlockFallbackProps = { type?: string; message?: string };
export default function BlockFallback({ type = "unknown", message }: BlockFallbackProps) { return <div className="migration-placeholder" role="status">{message ?? `Unsupported content block: ${type}`}</div>; }
