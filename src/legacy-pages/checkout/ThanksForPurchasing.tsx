import { Link } from "@/router/nextCompat";

export default function ThanksForPurchasing() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <section className="w-full max-w-2xl rounded-2xl border border-emerald-400/40 bg-slate-900 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-3xl text-emerald-300" aria-hidden="true">✓</div>
        <h1 className="text-3xl font-bold">Thank you for choosing our products.</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">We appreciate your trust and we&apos;ll do our best to meet your expectations.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/products" className="rounded-lg bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300">Continue shopping</Link>
          <Link to="/Account/TransactionHistory" className="rounded-lg border border-slate-600 px-5 py-3 font-semibold hover:border-slate-400">Transaction history</Link>
        </div>
      </section>
    </main>
  );
}
