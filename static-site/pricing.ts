import type {Design, Product} from '@/lib/types';

// Browser estimate only; the commercial server must recalculate every order.
export function estimateUnitPrice(product: Product, design?: Design | null): number {
  const areas = new Set(design?.layers.map(layer => layer.areaId) || []);
  return product.priceRub + [...areas].reduce((sum, id) => sum + (product.printAreas.find(area => area.id === id)?.extraPriceRub || 0), 0);
}
