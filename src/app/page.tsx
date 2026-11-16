import { BasicSteps } from "@/components/features/home/basic-steps";
import { HomeScreen } from "@/components/features/home/home-screen";
import { SiteHeader } from "@/components/features/layout/site-header";
import { isCategoryId } from "@/domain/categories";
import { SEARCH_MAX_LENGTH } from "@/domain/search";
import { topicService } from "@/services";

// Admin edits must reach viewers immediately (saving = publishing).
export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ q?: string | string[]; category?: string | string[] }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [{ topics, degraded }, params] = await Promise.all([
    topicService().getPublicTopics(),
    searchParams,
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
          steps={<BasicSteps />}
          initialQuery={q}
          initialCategory={category}
        />
      </main>
    </>
  );
}
