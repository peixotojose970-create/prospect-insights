import type { SearchCriteria } from "@/types";

/** Uses the existing search action unchanged, appending subsequent categories. */
export async function searchSelectedCategories(
  categories: string[],
  location: Omit<SearchCriteria, "category">,
  runSearch: (criteria: SearchCriteria, append?: boolean) => Promise<void>,
  onProgress: (current: number, total: number) => void = () => {},
) {
  const terms = [...new Set(categories.map((term) => term.trim()).filter(Boolean))];
  for (const [index, category] of terms.entries()) {
    onProgress(index + 1, terms.length);
    await runSearch({ ...location, category }, index > 0);
  }
}