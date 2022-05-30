import { BaseTtsCache, TtsCacheConfig, TtsData } from './plugins/tts-polly';

export type SimpleTtsCacheConfig = TtsCacheConfig;

export class SimpleTtsCache extends BaseTtsCache<SimpleTtsCacheConfig> {
  getDefaultConfig(): SimpleTtsCacheConfig {
    return {
      returnEncodedAudio: false,
    };
  }

  async getCacheData(key: string, locale: string, outputFormat: string): Promise<TtsData | undefined> {
    return;
  }

  async storeCacheData(key: string, locale: string, data: TtsData): Promise<void> {
    console.log({ data });
  }
}
