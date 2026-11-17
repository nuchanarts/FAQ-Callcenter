import type { Metadata } from "next";
import { BookImage, Play, ShieldCheck } from "lucide-react";
import { ManualLibraryView } from "@/components/features/manuals/manual-library";
import { SiteHeader } from "@/components/features/layout/site-header";
import { th } from "@/i18n/th";
import { getManualLibrary } from "@/services/manual-service";

export const metadata: Metadata = { title: th.nav.manuals };
// Content comes from the team's Google Sheet (cached 5 min in the service), so render per request.
export const dynamic = "force-dynamic";

const m = th.manuals;

export default async function ManualsPage() {
  const { library } = await getManualLibrary();
  const stats = [
    { icon: BookImage, text: `${library.onepage.length} One Page` },
    { icon: Play, text: `${library.videos.length} ${m.videosTitle}` },
    { icon: ShieldCheck, text: `Datacheck ${library.datacheck.length} เขต` },
  ];

  return (
    <>
      <SiteHeader />
      <section className="hero-bg overflow-hidden border-b-4 border-hero-edge text-hero-ink">
        <div className="page-width flex flex-col gap-3 pt-8 pb-10">
          <h1 className="text-3xl font-bold sm:text-4xl">{m.title}</h1>
          <p className="max-w-3xl text-hero-ink/85">{m.subtitle}</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {stats.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-2 rounded-pill bg-surface px-3.5 py-1.5 font-semibold text-ink shadow-raise"
              >
                <Icon aria-hidden className="size-4 text-herb" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <main id="main" className="page-width py-8 sm:py-10">
        <ManualLibraryView library={library} />
      </main>
    </>
  );
}
