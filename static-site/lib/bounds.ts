import type {Layer} from './types';

export function validLayerBounds(layer: Layer) {
  const angle = layer.rotation * Math.PI / 180;
  const rotatedWidth = Math.abs(layer.width * Math.cos(angle)) + Math.abs(layer.height * Math.sin(angle));
  const rotatedHeight = Math.abs(layer.width * Math.sin(angle)) + Math.abs(layer.height * Math.cos(angle));
  const centerX = layer.x + layer.width / 2, centerY = layer.y + layer.height / 2;
  return centerX - rotatedWidth / 2 >= 0 && centerY - rotatedHeight / 2 >= 0 && centerX + rotatedWidth / 2 <= 1 && centerY + rotatedHeight / 2 <= 1;
}
