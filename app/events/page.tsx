import type { Metadata } from "next";
import { EventsFeed } from "@/components/EventsFeed";

export const metadata: Metadata = {
  title: "イベント・大会フィード",
  description:
    "トリッキング・パルクールの大会・ジャム・ワークショップ・撮影会を月別フィードで一覧。種別・施設・開催状況で絞り込み、定員や申込締切も確認できます。",
};

export default function EventsPage() {
  return <EventsFeed />;
}
