import { Category, CATEGORY_KEYWORDS } from '../types';

const CATEGORY_CORRECTIONS_KEY = 'fintrack_category_corrections';

function normalizeKey(description: string) {
  return description.trim().toLowerCase();
}

export function loadCategoryCorrections(): Record<string, Category> {
  try {
    const raw = localStorage.getItem(CATEGORY_CORRECTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function saveCategoryCorrections(corrections: Record<string, Category>) {
  try {
    localStorage.setItem(CATEGORY_CORRECTIONS_KEY, JSON.stringify(corrections));
  } catch {}
}

export function learnCategoryCorrection(description: string, category: Category) {
  const key = normalizeKey(description);
  if (!key) return;
  const corrections = loadCategoryCorrections();
  corrections[key] = category;
  saveCategoryCorrections(corrections);
}

/**
 * Local keyword-based categorisation (instant, no API)
 */
export function localCategorize(description: string): Category {
  const lower = normalizeKey(description);
  if (!lower) return 'Other';

  const corrections = loadCategoryCorrections();
  if (corrections[lower]) {
    return corrections[lower];
  }

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category as Category;
    }
  }

  return 'Other';
}
