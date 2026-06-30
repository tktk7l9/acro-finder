import type { Metadata } from "next";
import { SkillsApp } from "@/components/SkillsApp";

export const metadata: Metadata = {
  title: "技ガイド / スキルリスト",
  description:
    "トリッキング・パルクール・体操・ブレイクダンス・スキー・スノーボードの技80種を一覧。難易度・ジャンル・タグで絞り込み、解説・コツ・前提技/派生技・コンボビルダーで習得をサポートします。",
};

export default function SkillsPage() {
  return <SkillsApp />;
}
