import { BasicSteps } from "@/components/features/home/basic-steps";
import { HomeScreen } from "@/components/features/home/home-screen";
import { SiteHeader } from "@/components/features/layout/site-header";
import { LatestNewsBanner } from "@/components/features/manuals/latest-news-banner";
import { isCategoryId } from "@/domain/categories";
import { SEARCH_MAX_LENGTH } from "@/domain/search";
import { topicService } from "@/services";
import { getManualLibrary } from "@/services/manual-service";

// Admin edits must reach viewers immediately (saving = publishing).
export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ q?: string | string[]; category?: string | string[] }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [{ topics, degraded }, params, manuals] = await Promise.all([
    topicService().getPublicTopics(),
    searchParams,
    getManualLibrary(),
  ]);
  const q = typeof params.q === "string" ? params.q.slice(0, SEARCH_MAX_LENGTH) : "";
  const category = isCategoryId(params.category) ? params.category : null;
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
