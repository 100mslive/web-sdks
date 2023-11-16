import { HMSVBPlugin, HMSVirtualBackgroundTypes } from '@100mslive/hms-virtual-background';

// Will support all media, setting to image here to test with current plugin interface
export const VB_EFFECT = {
  BLUR: 'blur',
  BEAUTIFY: 'BEAUTIFY',
  NONE: 'none',
  MEDIA: 'image',
};

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

export const vbPlugin = new HMSVBPlugin(HMSVirtualBackgroundTypes.NONE, HMSVirtualBackgroundTypes.NONE);
