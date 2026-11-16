import { BasicSteps } from "@/components/features/home/basic-steps";
import { HomeScreen } from "@/components/features/home/home-screen";
import { SiteHeader } from "@/components/features/layout/site-header";
import { topicService } from "@/services";

// Admin edits must reach viewers immediately (saving = publishing).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { topics, degraded } = await topicService().getPublicTopics();
  return (
    <>
      <SiteHeader />
      <main id="main">
        <HomeScreen topics={topics} degraded={degraded} steps={<BasicSteps />} />
      </main>
    </>
  );
}
