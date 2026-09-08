import { Link } from "@/router/nextCompat";
export default function NotFound() { return <section className="ph-error-page"><img src="/images/404.jpg" alt="404"/><h1>Page not found</h1><Link to="/" className="btn-hero">Return Home</Link></section>; }
