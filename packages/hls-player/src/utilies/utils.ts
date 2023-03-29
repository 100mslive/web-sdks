import { Level, LevelParsed } from 'hls.js';
import { ILevel } from '../interfaces/ILevel';

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
 * map Level[] to ILevel[]
 */
export const mapLevels = (qualityLevel: Level[] | LevelParsed[]): ILevel[] => {
  return qualityLevel.map((level: Level | LevelParsed) => mapLevel(level));
};

/**
 * map Level[] to ILevel[]
 */
export const mapLevel = (qualityLevel: Level | LevelParsed): ILevel => {
  return {
    resolution: qualityLevel.attrs?.RESOLUTION,
    bitrate: qualityLevel.bitrate,
    height: qualityLevel.height,
    id: qualityLevel.id,
    url: qualityLevel.url[0],
    width: qualityLevel.width,
  };
};
