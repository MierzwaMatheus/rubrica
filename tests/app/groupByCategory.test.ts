import { describe, it, expect } from "vitest";
import { groupByCategory } from "@/utils/groupByCategory";

describe("groupByCategory", () => {
  it("groups in first-appearance order and puts uncategorized last", () => {
    const items = [
      { id: 1, category: "Marca" },
      { id: 2 },
      { id: 3, category: "Tecnologia" },
      { id: 4, category: "Marca" },
      { id: 5, category: "  " },
    ];
    expect(groupByCategory(items).map(g => [g.category, g.items.map(i => i.id)])).toEqual([
      ["Marca", [1, 4]],
      ["Tecnologia", [3]],
      [undefined, [2, 5]],
    ]);
  });

  it("returns a single unnamed group when nothing has a category", () => {
    const groups = groupByCategory([{ id: 1 }, { id: 2, category: null }]);
    expect(groups).toHaveLength(1);
    expect(groups[0].category).toBeUndefined();
  });

  it("returns no groups for an empty list", () => {
    expect(groupByCategory([])).toEqual([]);
  });
});
