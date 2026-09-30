import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { SkillGraph } from "./SkillGraph";
import { SKILLS } from "@/lib/skills-data";

const byId = (id: string) => SKILLS.find((s) => s.id === id)!;
// round-off (Lv2, no prereqs) → back-tuck (Lv4) → back-full (Lv6): a real chain
// that exercises edges, and precision (parkour, Lv2) adds a second cluster.
const chain = [byId("round-off"), byId("back-tuck"), byId("back-full"), byId("precision")];

describe("SkillGraph", () => {
  it("shows the empty state when no skill matches", () => {
    const { container } = render(<SkillGraph skills={[]} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText("該当する技が見つかりません")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
  });

  it("draws one node per skill with its name and level", () => {
    const { container } = render(
      <SkillGraph skills={chain} selectedId={null} onSelect={() => {}} />,
    );
    expect(container.querySelectorAll(".skl-graph-node")).toHaveLength(4);
    expect(screen.getByText("ラウンドオフ")).toBeInTheDocument();
    expect(screen.getByText("プレシジョン")).toBeInTheDocument();
    // Level heads for every distinct level present.
    expect(screen.getByText("Lv.2")).toBeInTheDocument();
    expect(screen.getByText("Lv.4")).toBeInTheDocument();
    expect(screen.getByText("Lv.6")).toBeInTheDocument();
  });

  it("truncates long names so they fit the node", () => {
    const { container } = render(
      <SkillGraph skills={[byId("snapuswipe")]} selectedId={null} onSelect={() => {}} />,
    );
    // "スナップユースワイプ" is 10 characters: 7 kept + ellipsis.
    expect(container.querySelector(".skl-graph-name")?.textContent).toBe("スナップユース…");
  });

  it("draws an edge for each prerequisite that is also on the graph", () => {
    const { container } = render(
      <SkillGraph skills={chain} selectedId={null} onSelect={() => {}} />,
    );
    // round-off→back-tuck and back-tuck→back-full; precision has no prereqs.
    expect(container.querySelectorAll(".skl-graph-edge")).toHaveLength(2);
  });

  it("skips edges whose prerequisite is filtered out", () => {
    const { container } = render(
      <SkillGraph skills={[byId("back-full")]} selectedId={null} onSelect={() => {}} />,
    );
    expect(container.querySelectorAll(".skl-graph-edge")).toHaveLength(0);
  });

  it("highlights the selected node and its edges", () => {
    const { container } = render(
      <SkillGraph skills={chain} selectedId="back-tuck" onSelect={() => {}} />,
    );
    const selected = container.querySelector(".skl-graph-node.sel");
    expect(selected?.textContent).toContain("バックタック");
    // Both edges touch back-tuck.
    expect(container.querySelectorAll(".skl-graph-edge.active")).toHaveLength(2);
  });

  it("reports the clicked skill", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <SkillGraph skills={chain} selectedId={null} onSelect={onSelect} />,
    );
    const node = [...container.querySelectorAll(".skl-graph-node")].find((n) =>
      n.textContent?.includes("プレシジョン"),
    )!;
    fireEvent.click(node);
    expect(onSelect).toHaveBeenCalledWith("precision");
  });

  it("labels the lanes by similarity cluster and explains the three axes", () => {
    render(<SkillGraph skills={chain} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText("フリップ系")).toBeInTheDocument();
    expect(screen.getByText("基礎・移動系")).toBeInTheDocument();
    expect(screen.getByText("難易度 →")).toBeInTheDocument();
    expect(screen.getByText("似た技クラスタ ↘")).toBeInTheDocument();
    expect(screen.getByText("派生段階 ↑")).toBeInTheDocument();
  });

  it("shows a legend entry for every genre", () => {
    render(<SkillGraph skills={chain} selectedId={null} onSelect={() => {}} />);
    for (const name of ["トリッキング", "パルクール", "体操", "ブレイク", "スキー", "スノボ"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });
});
