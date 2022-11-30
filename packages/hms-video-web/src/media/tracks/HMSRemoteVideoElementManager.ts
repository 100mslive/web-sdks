import { HMSRemoteVideoTrack } from './HMSRemoteVideoTrack';
import { HMSPreferredSimulcastLayer, HMSSimulcastLayer } from '../../interfaces/simulcast-layers';
import { isBrowser } from '../../utils/support';
import { debounce } from '../../utils/timer-utils';

export class HMSRemoteVideoElementManager {
  private DELTA_THRESHOLD = 0.5;
  private resizeObserver?: ResizeObserver;
  private videoElements = new Set<HTMLVideoElement>();
  private layerToIntMapping = {
    [HMSSimulcastLayer.NONE]: -1,
    [HMSSimulcastLayer.LOW]: 0,
    [HMSSimulcastLayer.MEDIUM]: 1,
    [HMSSimulcastLayer.HIGH]: 2,
  };
  constructor(private track: HMSRemoteVideoTrack) {
    if (isBrowser && typeof window.ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(debounce(this.handleResize, 300));
    }
  }

  async addVideoElement(videoElement: HTMLVideoElement) {
    if (this.resizeObserver) {
      this.resizeObserver.observe(videoElement, { box: 'border-box' });
    } else {
      this.track.setPreferredLayer(this.track.getPreferredLayer());
    }
  }

  private handleResize = async (entries: ResizeObserverEntry[]) => {
    let maxLayer!: HMSPreferredSimulcastLayer;
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      const layer = this.getClosestLayer({ width, height });
      if (!maxLayer) {
        maxLayer = layer;
      } else {
        maxLayer = this.layerToIntMapping[layer] > this.layerToIntMapping[maxLayer] ? layer : maxLayer;
      }
    }
    await this.track.setPreferredLayer(maxLayer);
  };

  private getClosestLayer = (videoResolution: { width: number; height: number }): HMSPreferredSimulcastLayer => {
    let closestLayer: HMSPreferredSimulcastLayer = HMSSimulcastLayer.HIGH;
    const maxDimension = videoResolution.width >= videoResolution.height ? 'width' : 'height';
    const layers = this.track
      .getSimulcastDefinitions()
      .sort((a, b) => this.layerToIntMapping[a.layer] - this.layerToIntMapping[b.layer]);
    const videoDimesion = videoResolution[maxDimension];
    for (let i = 0; i < layers.length; i++) {
      const { resolution, layer } = layers[i];
      const layerDimension = resolution[maxDimension];
      if (videoDimesion <= layerDimension) {
        closestLayer = layer;
        break;
      } else {
        const nextLayer = layers[i + 1];
        const nextLayerDimension = nextLayer ? nextLayer.resolution[maxDimension] : Number.POSITIVE_INFINITY;
        // calculating which layer this dimension is closer to
        const proximityPercent = (videoDimesion - layerDimension) / (nextLayerDimension - layerDimension);
        if (proximityPercent < this.DELTA_THRESHOLD) {
          // the element's dimension is closer to the current layer
          closestLayer = layer;
          break;
        }
      }
    }
    return closestLayer;
  };

  removeVideoElement(videoElement: HTMLVideoElement): void {
    this.videoElements.delete(videoElement);
    this.resizeObserver?.unobserve(videoElement);
  }
}
