import { HMSSimulcastLayerDefinition } from '../../interfaces/simulcast-layers';

/**
 * Common simulcast layer management functionality shared between local and remote video tracks
 */
export class SimulcastLayerManager {
  private _layerDefinitions: HMSSimulcastLayerDefinition[] = [];

  /**
   * Set the available simulcast layer definitions
   * @internal
   */
  setSimulcastDefinitions(definitions: HMSSimulcastLayerDefinition[]): void {
    this._layerDefinitions = definitions;
  }

  /**
   * Get available simulcast definitions for the track
   * Returns a copy to prevent external modifications
   */
  getSimulcastDefinitions(): HMSSimulcastLayerDefinition[] {
    return [...this._layerDefinitions];
  }

  /**
   * Find a specific layer definition by layer name
   */
  getLayerDefinition(layerName: string): HMSSimulcastLayerDefinition | undefined {
    return this._layerDefinitions.find(layer => layer.layer === layerName);
  }

  /**
   * Check if simulcast is available (has layer definitions)
   */
  hasSimulcastLayers(): boolean {
    return this._layerDefinitions.length > 0;
  }
}
