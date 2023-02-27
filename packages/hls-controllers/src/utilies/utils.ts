import { Level, LevelParsed } from 'hls.js';
import { ILevel } from '../interfaces/ILevel';

/**
 *
 * @param payload a base64 string coming from backend
 * @returns a parsed data which contains payload, start_date, end_date, version
 */
export const metadataPayloadParser = (payload: string) => {
  try {
    const data = window.atob(payload);
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
  const levels = qualityLevel.map((level: Level | LevelParsed) => mapLevel(level));
  return levels;
};

/**
 * map Level[] to ILevel[]
 */
export const mapLevel = (qualityLevel: Level | LevelParsed): ILevel => {
  const level = {
    attrs: qualityLevel.attrs,
    bitrate: qualityLevel.bitrate,
    height: qualityLevel.height,
    id: qualityLevel.id,
    url: qualityLevel.url[0],
    width: qualityLevel.width,
    name: qualityLevel.name || '',
    level: 'level' in qualityLevel ? qualityLevel.level : undefined,
  };
  return level;
};
