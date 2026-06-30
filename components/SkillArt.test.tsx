import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SkillArt } from "./SkillArt";
import { SKILLS } from "@/lib/skills-data";

describe("SkillArt", () => {
  it("renders an svg with drawn paths for a skill", () => {
    const { container } = render(<SkillArt skill={SKILLS[0]} />);
    const svg = container.querySelector("svg.skl-art");
    expect(svg).toBeTruthy();
    expect(svg!.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("is deterministic for the same skill", () => {
    const a = render(<SkillArt skill={SKILLS[7]} />).container.innerHTML;
    const b = render(<SkillArt skill={SKILLS[7]} />).container.innerHTML;
    expect(a).toBe(b);
  });

  it("produces distinct artwork for different skills", () => {
    const a = render(<SkillArt skill={SKILLS[0]} />).container.innerHTML;
    const b = render(<SkillArt skill={SKILLS[1]} />).container.innerHTML;
    expect(a).not.toBe(b);
  });
});
