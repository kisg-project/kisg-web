import { AKAD_INFO } from "../terms";

/** Penjelasan singkat akad KPR syariah. */
export function AkadInfo() {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {AKAD_INFO.map((akad) => (
        <div key={akad.name} className="rounded-lg border bg-card p-5">
          <dt className="font-bold">{akad.name}</dt>
          <dd className="mt-2 text-sm text-subtle-foreground">{akad.text}</dd>
        </div>
      ))}
    </dl>
  );
}
