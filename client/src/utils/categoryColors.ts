// Category color mapping - ensures consistent colors across the app
export const CATEGORY_COLORS: Record<string, string> = {
  'dining': '#ef4444',      // red
  'groceries': '#10b981',   // green  
  'transport': '#3b82f6',   // blue
  'shopping': '#8b5cf6',    // purple
  'entertainment': '#f59e0b', // yellow
  'healthcare': '#06b6d4',  // cyan
  'utilities': '#84cc16',   // lime
  'other': '#6b7280'        // gray
};

// Fallback colors for any unmapped categories
const FALLBACK_COLORS = ['#f97316', '#ec4899', '#14b8a6', '#a855f7', '#eab308'];

export function getCategoryColor(category: string): string {
  const normalizedCategory = category.toLowerCase();
  
  // Return predefined color if exists
  if (CATEGORY_COLORS[normalizedCategory]) {
    return CATEGORY_COLORS[normalizedCategory];
  }
  
  // For unmapped categories, use a consistent hash-based color assignment
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % FALLBACK_COLORS.length;
  
  return FALLBACK_COLORS[colorIndex];
}

export function getAllCategoryColors(): Record<string, string> {
  return CATEGORY_COLORS;
}