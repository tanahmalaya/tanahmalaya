const STEPS = [
  { key: "cart", label: "Troli" },
  { key: "information", label: "Maklumat" },
  { key: "shipping", label: "Penghantaran" },
  { key: "payment", label: "Pembayaran" },
] as const;

export type CheckoutStepKey = (typeof STEPS)[number]["key"];

export default function CheckoutSteps({ current }: { current: CheckoutStepKey }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4 mb-8 text-xs sm:text-sm">
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <li key={step.key} className="flex items-center gap-2 sm:gap-4">
            <span
              className={`flex items-center gap-1.5 font-semibold ${
                isCurrent ? "text-brand-dark" : isDone ? "text-brand-gold" : "text-brand-dark/30"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                  isCurrent
                    ? "bg-brand-gold text-brand-dark"
                    : isDone
                      ? "bg-brand-gold/30 text-brand-dark"
                      : "bg-brand-dark/10 text-brand-dark/40"
                }`}
              >
                {idx + 1}
              </span>
              {step.label}
            </span>
            {idx < STEPS.length - 1 && <span className="text-brand-dark/20">&rarr;</span>}
          </li>
        );
      })}
    </ol>
  );
}
