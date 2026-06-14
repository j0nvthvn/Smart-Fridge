import { COLORS } from './colors';

export const CATEGORIES = [
  'Lácteos', 'Carnes', 'Frutas', 'Verduras',
  'Bebidas', 'Congelados', 'Despensa', 'Snacks', 'Otro',
];

export const CATEGORY_CONFIG = {
  'Lácteos':    { icon: 'baby-bottle',        color: COLORS.orange400, bg: COLORS.orange50 },
  'Carnes':     { icon: 'food-steak',          color: COLORS.red400,    bg: COLORS.red50    },
  'Frutas':     { icon: 'food-apple',          color: '#9C27B0',        bg: '#F3E5F5'       },
  'Verduras':   { icon: 'leaf',                color: '#4CAF50',        bg: '#E8F5E9'       },
  'Bebidas':    { icon: 'bottle-tonic',        color: COLORS.blue700,   bg: COLORS.blue50   },
  'Congelados': { icon: 'snowflake',           color: '#0288D1',        bg: '#E1F5FE'       },
  'Despensa':   { icon: 'bread-slice',         color: '#795548',        bg: '#EFEBE9'       },
  'Snacks':     { icon: 'cookie',              color: '#FB8C00',        bg: COLORS.orange50 },
  'Otro':       { icon: 'basket',              color: COLORS.gray500,   bg: COLORS.gray100  },
};

export function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] ?? { icon: 'basket', color: COLORS.gray500, bg: COLORS.gray100 };
}
