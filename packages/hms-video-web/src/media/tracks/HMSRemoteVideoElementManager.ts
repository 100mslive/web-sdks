import { HMSRemoteVideoTrack } from './HMSRemoteVideoTrack';
import { HMSPreferredSimulcastLayer } from '../../interfaces/simulcast-layers';
import { isBrowser } from '../../utils/support';
import { debounce } from '../../utils/timer-utils';

export class HMSRemoteVideoElementManager {
  private DELTA_THRESHOLD = 0.5;
  private resizeObserver?: ResizeObserver;
  constructor(private track: HMSRemoteVideoTrack) {}

  setVideoElement(videoElement: HTMLVideoElement) {
    if (isBrowser && typeof window.ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(debounce(this.handleResize, 300));
      this.resizeObserver.observe(videoElement, { box: 'border-box' });
    }
  }

  private handleResize = async (entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const layer = this.getClosestLayer({ width: entry.contentRect.height, height: entry.contentRect.height });
      await this.track.setPreferredLayer(layer);
    }
  };

  private getClosestLayer = (dimensions: { width: number; height: number }): HMSPreferredSimulcastLayer => {
    let closestLayer: HMSPreferredSimulcastLayer | undefined = undefined;
    const maxDimension = dimensions.width >= dimensions.height ? 'width' : 'height';
    const layers = this.track.getSimulcastDefinitions().reverse();
    for (let i = 0; i < layers.length; i++) {
      const { resolution, layer } = layers[i];
      if (dimensions[maxDimension] <= resolution[maxDimension]) {
        closestLayer = layer;
        break;
      } else {
        const nextLayer = layers[i + 1];
        const nextLayerDimension = nextLayer ? nextLayer.resolution[maxDimension] : Number.POSITIVE_INFINITY;
        // calculating which layer this dimension is closer to
        const proximityPercent =
          dimensions[maxDimension] - resolution[maxDimension] / (nextLayerDimension - resolution[maxDimension]);
        if (proximityPercent < this.DELTA_THRESHOLD) {
          // the element's dimension is closer to the current layer
          closestLayer = layer;
        }
      }
    }
    return closestLayer!;
  };

  cleanup() {
    this.resizeObserver?.disconnect();
  }
}
