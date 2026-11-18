"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquareWarning, ThumbsUp } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { th } from "@/i18n/th";
import { logTopicVote, topicVote } from "@/lib/log-event";

export function reportHref(topicId: string): string {
  return `/report?topic=${encodeURIComponent(topicId)}`;
}

/**
 * "วิธีนี้แก้ปัญหาได้ไหม?" at the end of every answer. ได้ผล counts a helpful vote; ยังไม่ได้
 * counts an unhelpful one on its way to the report form prefilled with this topic.
 */
export function HelpfulFeedback({ topicId }: { topicId: string }) {
  const [vote, setVote] = useState(() => topicVote(topicId));
  const t = th.topic;

  const reportLink = (
    <Link
      href={reportHref(topicId)}
      onClick={() => {
        logTopicVote(topicId, "unhelpful");
        setVote(topicVote(topicId));
      }}
      className={buttonClass("secondary", "md")}
    >
      <MessageSquareWarning aria-hidden className="size-5" />
      {t.notSolved}
    </Link>
  );

  return (
    <div className="flex flex-col gap-3 rounded-soft border border-dashed border-line-strong p-4">
      {vote ? (
        <p role="status" className="font-semibold text-herb">
          {vote === "helpful" ? t.helpfulThanks : t.unhelpfulThanks}
        </p>
      ) : (
        <>
          <p className="font-semibold text-ink">{t.helpfulQuestion}</p>
          <p className="-mt-2 text-[0.95rem] text-ink-muted">{t.notSolvedHint}</p>
        </>
      )}
      {vote !== "helpful" && (
        <div className="flex flex-wrap gap-2">
          {!vote && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                logTopicVote(topicId, "helpful");
                setVote(topicVote(topicId));
              }}
            >
              <ThumbsUp aria-hidden className="size-5" />
              {t.helpfulYes}
            </Button>
          )}
          {reportLink}
        </div>
      )}
    </div>
  );
}
