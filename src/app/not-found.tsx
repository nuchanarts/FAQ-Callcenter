import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { th } from "@/i18n/th";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-20">
      <SearchX aria-hidden className="size-10 text-ink-faint" />
      <h1 className="text-3xl font-bold">{th.errors.notFoundTitle}</h1>
      <Link href="/" className={buttonClass("primary")}>
        {th.errors.backHome}
      </Link>
    </main>
  );
}
