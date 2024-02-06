import { Level, LevelParsed } from 'hls.js';
import { HMSHLSLayer } from '../interfaces/IHMSHLSLayer';

/**
 *
 * @param payload a base64 string coming from backend
 * @returns a parsed data which contains payload, start_date, end_date, version
 */
export const metadataPayloadParser = (payload: string): Record<string, any> => {
  try {
    const data = window?.atob(payload);
    const parsedData = JSON.parse(data);
    return parsedData;
  } catch (e) {
    return { payload };
  }
};

/**
 * map Level[] to HMSHLSLayer[]
 */
export const mapLayers = (levels: Level[] | LevelParsed[]): HMSHLSLayer[] => {
  return levels.map((level: Level | LevelParsed) => mapLayer(level));
};

/**
 * map Level[] to HMSHLSLayer[]
 */
export const mapLayer = (quality: Level | LevelParsed): HMSHLSLayer => {
  return {
    resolution: quality.attrs?.RESOLUTION,
    bitrate: quality.bitrate,
    height: quality.height,
    id: quality.id,
    url: quality.url[0],
    width: quality.width,
  };
};
