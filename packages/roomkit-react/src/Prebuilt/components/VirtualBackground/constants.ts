export const defaultMedia = [
  'https://assets.100ms.live/webapp/vb-mini/vb-1.jpg',
  'https://assets.100ms.live/webapp/vb-mini/vb-2.jpg',
  'https://assets.100ms.live/webapp/vb-mini/vb-3.png',
  'https://assets.100ms.live/webapp/vb-mini/vb-4.jpg',
  'https://assets.100ms.live/webapp/vb-mini/vb-5.jpg',
  'https://assets.100ms.live/webapp/vb-mini/vb-6.jpg',
  'https://assets.100ms.live/webapp/vb-mini/vb-7.jpg',
  'https://assets.100ms.live/webapp/vb-mini/vb-8.jpg',
  'https://assets.100ms.live/webapp/vb-mini/vb-9.jpg',
  'https://assets.100ms.live/webapp/vb-mini/vb-10.jpg',
  'https://assets.100ms.live/webapp/vb-mini/vb-11.jpg',
  'https://assets.100ms.live/webapp/vb-mini/vb-12.jpg',
];

const baseQualityMap: Record<number, string> = {
  0: 'lightning',
  1: 'speed',
  2: 'balanced',
  3: 'quality',
};

const reverseQualityMap = Object.fromEntries(
  Object.entries(baseQualityMap).map(([key, value]) => [value, parseInt(key)]),
);

export const qualityMap: Record<string | number, number | string> = { ...baseQualityMap, ...reverseQualityMap };
