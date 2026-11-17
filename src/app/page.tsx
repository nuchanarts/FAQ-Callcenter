import { BasicSteps } from "@/components/features/home/basic-steps";
import { HomeScreen } from "@/components/features/home/home-screen";
import { SiteHeader } from "@/components/features/layout/site-header";
import { LatestNewsBanner } from "@/components/features/manuals/latest-news-banner";
import { SEARCH_MAX_LENGTH } from "@/domain/search";
import { taxonomyService, topicService } from "@/services";
import { getManualLibrary } from "@/services/manual-service";

// Admin edits must reach viewers immediately (saving = publishing).
export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ q?: string | string[]; category?: string | string[] }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [{ topics, degraded }, params, manuals, taxonomy] = await Promise.all([
    topicService().getPublicTopics(),
    searchParams,
    getManualLibrary(),
    taxonomyService().getTaxonomy(),
  ]);
  const q = typeof params.q === "string" ? params.q.slice(0, SEARCH_MAX_LENGTH) : "";
  const requested = typeof params.category === "string" ? params.category : null;
  const category = taxonomy.categories.some((c) => c.id === requested) ? requested : null;
  return (
    <>
      <SiteHeader />
      <main id="main">
        <HomeScreen
          topics={topics}
          degraded={degraded}
          steps={
            <>
              <BasicSteps />
              <LatestNewsBanner news={manuals.library.news[0]} />
            </>
          }
          initialQuery={q}
          initialCategory={category}
        />
      </main>
    </>
  );
}
