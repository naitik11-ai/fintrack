import { Category, CATEGORY_KEYWORDS } from '../types';

/**
 * Local keyword-based categorisation (instant, no API)
 */
export function localCategorize(description: string): Category {
  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category as Category;
    }
  }
  return 'Other';
}
