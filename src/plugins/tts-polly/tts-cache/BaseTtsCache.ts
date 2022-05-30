import { Plugin, PluginConfig } from '@jovotech/framework';
import { TtsData } from '../TtsData';

export interface TtsCacheConfig extends PluginConfig {
  returnEncodedAudio: boolean;
}

export abstract class BaseTtsCache<
  CONFIG extends TtsCacheConfig = TtsCacheConfig,
> extends Plugin<CONFIG> {
  abstract getCacheData(
    key: string,
    locale: string,
    outputFormat: string,
  ): Promise<TtsData | undefined>;
  abstract storeCacheData(key: string, locale: string, data: TtsData): Promise<void>;
}
