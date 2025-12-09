/**
 * Beauty categories constants
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md
 */

/**
 * Beauty category types
 */
export const BEAUTY_CATEGORY_TYPE = 1;

/**
 * Beauty sub-categories for filtering
 */
export const BEAUTY_CATEGORIES = {
  HAIR: 'hair',
  NAILS: 'nails',
  MASSAGE: 'massage',
  SPA: 'spa',
  MAKEUP: 'makeup',
  BARBER: 'barber',
  SKINCARE: 'skincare',
  WAXING: 'waxing',
  LASHES: 'lashes',
  BROWS: 'brows',
} as const;

export type BeautyCategory = typeof BEAUTY_CATEGORIES[keyof typeof BEAUTY_CATEGORIES];

/**
 * Highlight types for homepage sections
 */
export const HIGHLIGHT_TYPES = {
  TRENDING: 'Trending',
  NAIL_STUDIO: 'Nail studio',
  MASSAGE_SALON: 'Massage salon',
  HAIR_SALON: 'Hair salon',
} as const;

export type HighlightType = typeof HIGHLIGHT_TYPES[keyof typeof HIGHLIGHT_TYPES];

/**
 * Category labels by language
 */
export const CATEGORY_LABELS: Record<BeautyCategory, Record<string, string>> = {
  hair: {
    en: 'Hair',
    fr: 'Coiffure',
    th: 'ทำผม',
  },
  nails: {
    en: 'Nails',
    fr: 'Ongles',
    th: 'เล็บ',
  },
  massage: {
    en: 'Massage',
    fr: 'Massage',
    th: 'นวด',
  },
  spa: {
    en: 'Spa',
    fr: 'Spa',
    th: 'สปา',
  },
  makeup: {
    en: 'Makeup',
    fr: 'Maquillage',
    th: 'แต่งหน้า',
  },
  barber: {
    en: 'Barber',
    fr: 'Barbier',
    th: 'ตัดผมชาย',
  },
  skincare: {
    en: 'Skincare',
    fr: 'Soins de la peau',
    th: 'ดูแลผิว',
  },
  waxing: {
    en: 'Waxing',
    fr: 'Épilation',
    th: 'แว็กซ์',
  },
  lashes: {
    en: 'Lashes',
    fr: 'Cils',
    th: 'ขนตา',
  },
  brows: {
    en: 'Brows',
    fr: 'Sourcils',
    th: 'คิ้ว',
  },
};

/**
 * Get category label for a language
 */
export function getCategoryLabel(category: BeautyCategory, lang: string = 'en'): string {
  return CATEGORY_LABELS[category]?.[lang] || CATEGORY_LABELS[category]?.['en'] || category;
}

/**
 * Get all categories with labels for a language
 */
export function getAllCategoriesWithLabels(lang: string = 'en'): Array<{ id: BeautyCategory; label: string }> {
  return Object.values(BEAUTY_CATEGORIES).map(category => ({
    id: category,
    label: getCategoryLabel(category, lang),
  }));
}

