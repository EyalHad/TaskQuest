import { describe, it, expect } from "vitest";
import { buildTree, xpForLevel, getSkillTier, getSkillProgress } from "../skill-tree";
import type { Skill } from "../../types";

function makeSkill(overrides: Partial<Skill> & { id: number; name: string }): Skill {
  return {
    category: "INT",
    parentSkillId: null,
    currentXp: 0,
    level: 1,
    icon: "📘",
    sortOrder: 0,
    prestigeCount: 0,
    lastXpDate: null,
    targetLevel: null,
    ...overrides,
  };
}

describe("xpForLevel", () => {
  it("returns 100 for level 1", () => {
    expect(xpForLevel(1)).toBe(100);
  });

  it("follows the 100 * level^1.5 polynomial", () => {
    expect(xpForLevel(2)).toBe(Math.round(100 * Math.pow(2, 1.5)));
    expect(xpForLevel(5)).toBe(Math.round(100 * Math.pow(5, 1.5)));
    expect(xpForLevel(10)).toBe(Math.round(100 * Math.pow(10, 1.5)));
  });

  it("returns 0 for level 0", () => {
    expect(xpForLevel(0)).toBe(0);
  });

  it("increases monotonically", () => {
    for (let i = 1; i < 20; i++) {
      expect(xpForLevel(i + 1)).toBeGreaterThan(xpForLevel(i));
    }
  });
});

describe("getSkillTier", () => {
  it("returns null for level 0", () => {
    expect(getSkillTier(0)).toBeNull();
  });

  it("returns Bronze for levels 1-5", () => {
    for (let i = 1; i <= 5; i++) {
      expect(getSkillTier(i)?.name).toBe("Bronze");
    }
  });

  it("returns Silver for levels 6-10", () => {
    for (let i = 6; i <= 10; i++) {
      expect(getSkillTier(i)?.name).toBe("Silver");
    }
  });

  it("returns Gold for levels 11-15", () => {
    for (let i = 11; i <= 15; i++) {
      expect(getSkillTier(i)?.name).toBe("Gold");
    }
  });

  it("returns Platinum for levels above 15", () => {
    expect(getSkillTier(16)?.name).toBe("Platinum");
    expect(getSkillTier(50)?.name).toBe("Platinum");
  });
});

describe("getSkillProgress", () => {
  it("calculates progress for level 1 skill with 0 XP", () => {
    const skill = makeSkill({ id: 1, name: "Test", level: 1, currentXp: 0 });
    const result = getSkillProgress(skill);
    expect(result.progress).toBe(0);
    expect(result.needed).toBe(xpForLevel(1));
    expect(result.percent).toBe(0);
  });

  it("calculates percent for partial XP", () => {
    const needed = xpForLevel(1);
    const skill = makeSkill({ id: 1, name: "Test", level: 1, currentXp: Math.floor(needed / 2) });
    const result = getSkillProgress(skill);
    expect(result.percent).toBeCloseTo(50, 0);
  });

  it("calculates progress for higher levels", () => {
    const prevXp = xpForLevel(4);
    const nextXp = xpForLevel(5);
    const halfWay = prevXp + Math.floor((nextXp - prevXp) / 2);
    const skill = makeSkill({ id: 1, name: "Test", level: 5, currentXp: halfWay });
    const result = getSkillProgress(skill);
    expect(result.percent).toBeCloseTo(50, 0);
    expect(result.needed).toBe(nextXp - prevXp);
  });

  it("clamps percent between 0 and 100", () => {
    const skill = makeSkill({ id: 1, name: "Test", level: 1, currentXp: xpForLevel(1) + 999 });
    expect(getSkillProgress(skill).percent).toBeLessThanOrEqual(100);

    const skill2 = makeSkill({ id: 2, name: "Test2", level: 5, currentXp: 0 });
    expect(getSkillProgress(skill2).percent).toBeGreaterThanOrEqual(0);
    expect(getSkillProgress(skill2).progress).toBeGreaterThanOrEqual(0);
  });
});

describe("buildTree", () => {
  it("returns empty array for no skills", () => {
    expect(buildTree([])).toEqual([]);
  });

  it("builds a flat list of roots when all parentSkillId are null", () => {
    const skills = [
      makeSkill({ id: 1, name: "STR", category: "STR" }),
      makeSkill({ id: 2, name: "INT", category: "INT" }),
    ];
    const tree = buildTree(skills);
    expect(tree).toHaveLength(2);
    expect(tree[0].children).toHaveLength(0);
    expect(tree[1].children).toHaveLength(0);
  });

  it("nests children under their parent", () => {
    const skills = [
      makeSkill({ id: 1, name: "STR", category: "STR" }),
      makeSkill({ id: 2, name: "Fitness", category: "STR", parentSkillId: 1 }),
      makeSkill({ id: 3, name: "Combat", category: "STR", parentSkillId: 1 }),
    ];
    const tree = buildTree(skills);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].name).toBe("Fitness");
    expect(tree[0].children[1].name).toBe("Combat");
  });

  it("builds a 3-level tree", () => {
    const skills = [
      makeSkill({ id: 1, name: "STR", category: "STR" }),
      makeSkill({ id: 2, name: "Fitness", category: "STR", parentSkillId: 1 }),
      makeSkill({ id: 3, name: "Running", category: "STR", parentSkillId: 2, level: 5 }),
      makeSkill({ id: 4, name: "Weights", category: "STR", parentSkillId: 2, level: 3 }),
    ];
    const tree = buildTree(skills);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].children).toHaveLength(2);
  });

  it("computes derived levels by averaging children", () => {
    const skills = [
      makeSkill({ id: 1, name: "STR", category: "STR", level: 0 }),
      makeSkill({ id: 2, name: "Group", category: "STR", parentSkillId: 1, level: 0 }),
      makeSkill({ id: 3, name: "Leaf A", category: "STR", parentSkillId: 2, level: 6 }),
      makeSkill({ id: 4, name: "Leaf B", category: "STR", parentSkillId: 2, level: 4 }),
    ];
    const tree = buildTree(skills);
    const group = tree[0].children[0];
    expect(group.derivedLevel).toBe(5); // avg(6,4) = 5
    expect(tree[0].derivedLevel).toBe(5); // avg of group = 5
  });

  it("leaf nodes use their own level as derivedLevel", () => {
    const skills = [
      makeSkill({ id: 1, name: "STR", category: "STR" }),
      makeSkill({ id: 2, name: "Leaf", category: "STR", parentSkillId: 1, level: 7 }),
    ];
    const tree = buildTree(skills);
    expect(tree[0].children[0].derivedLevel).toBe(7);
  });
});
