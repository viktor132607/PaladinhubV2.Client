export default function NotFound() {
  return (
    <section className="grid min-h-[70vh] content-center place-items-center gap-5 p-10 text-center">
      <img src="/images/404.jpg" alt="404" className="w-full max-w-[700px]" />
      <h1>Page not found</h1>
      <a href="/" className="btn-hero">Return Home</a>
    </section>
  );
}
