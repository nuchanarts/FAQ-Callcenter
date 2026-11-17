import { th } from "@/i18n/th";

/**
 * "3 ขั้นก่อนแจ้งปัญหา" as one perforated medicine-label strip (Constitution I: visible immediately).
 * Numbered because the content is a real sequence.
 */
export function BasicSteps() {
  return (
    <section
      aria-labelledby="basic-steps-title"
      className="overflow-hidden rounded-soft border border-line bg-surface shadow-raise"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-dashed border-line-strong px-5 pt-4 pb-3 lg:pt-3 lg:pb-2">
        <h2 id="basic-steps-title" className="text-xl font-semibold text-herb lg:text-lg">
          {th.basicSteps.title}
        </h2>
        <p className="text-[0.95rem] text-ink-faint">{th.basicSteps.subtitle}</p>
      </div>
      <ol className="grid sm:grid-cols-3">
        {th.basicSteps.steps.map((step, i) => (
          <li
            key={step.title}
            className="relative flex gap-3 border-line px-5 py-4 not-last:border-b sm:not-last:border-r sm:not-last:border-b-0 sm:not-last:border-dashed lg:pt-3 lg:pb-4"
          >
            <span
              aria-hidden="true"
              className="font-display text-4xl leading-none font-bold text-herb/25 tabular-nums lg:text-3xl"
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold text-ink">{step.title}</h3>
              {/* Thai needs ≥1.6 line-height: stacked vowels/tone marks collide when tighter. */}
              <p className="mt-1 text-[0.97rem] leading-[1.65] text-ink-muted lg:text-[0.93rem]">
                {step.body}
                {step.link && (
                  <>
                    {" "}
                    <a
                      href={step.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-herb underline underline-offset-2 hover:text-herb-strong"
                    >
                      {step.link.label}
                    </a>{" "}
                    {"after" in step ? step.after : null}
                  </>
                )}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
