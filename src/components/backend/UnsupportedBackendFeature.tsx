interface UnsupportedBackendFeatureProps {
  title: string;
  description: string;
}

const UnsupportedBackendFeature = ({
  title,
  description,
}: UnsupportedBackendFeatureProps) => (
  <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <p className="text-sm font-semibold uppercase tracking-[0.24em]">Not exposed by the backend</p>
      <h1 className="mt-4 text-3xl font-bold">{title}</h1>
      <p className="mt-4 text-sm leading-6">{description}</p>
    </div>
  </section>
);

export default UnsupportedBackendFeature;
