import {
  PollyClient,
  SynthesizeSpeechCommand,
  SynthesizeSpeechCommandInput,
} from '@aws-sdk/client-polly';
import type { Credentials } from '@aws-sdk/types';

import { Jovo, DeepPartial } from '@jovotech/framework';
import { TtsData } from './TtsData';
import { TtsPlugin, TtsPluginConfig } from './TtsPlugin';
import { getBase64Audio } from './util';

export interface PollyTtsConfig extends TtsPluginConfig {
  credentials: Credentials;
  region: string;
  lexiconNames?: string[];
  voiceId: string;
  sampleRate: string;
  languageCode?: string;
  speechMarkTypes?: string[];
  engine: string;
}

export type PollyTtsInitConfig = DeepPartial<PollyTtsConfig> &
  Pick<PollyTtsConfig, 'credentials' | 'region'>;

export class PollyTts extends TtsPlugin<PollyTtsConfig> {
  readonly client: PollyClient;

  constructor(config: PollyTtsInitConfig) {
    super(config);

    this.client = new PollyClient({
      credentials: this.config.credentials,
      region: this.config.region,
    });
  }

  getDefaultConfig(): PollyTtsConfig {
    return {
      region: '',
      credentials: {
        accessKeyId: '',
        secretAccessKey: '',
      },
      outputFormat: 'mp3',
      voiceId: 'Matthew',
      sampleRate: '16000',
      engine: 'standard',
      fallbackLocale: 'en-US',
      includeEncodedAudio: false,
    };
  }

  getKeyPrefix(): string | undefined {
    return this.config.voiceId;
  }

  async processTts(jovo: Jovo, text: string, textType: string): Promise<TtsData | undefined> {
    const params: SynthesizeSpeechCommandInput = {
      Text: text,
      TextType: textType,
      OutputFormat: this.config.outputFormat,
      VoiceId: this.config.voiceId,
      SampleRate: this.config.sampleRate,
      LanguageCode: this.config.languageCode,
      SpeechMarkTypes: this.config.speechMarkTypes,
      Engine: this.config.engine,
      LexiconNames: this.config.lexiconNames,
    };

    const command = new SynthesizeSpeechCommand(params);

    try {
      const response = await this.client.send(command);
      if (!response.AudioStream) {
        return;
      }

      const result: TtsData = {
        contentType: response.ContentType,
        text,
        fileExtension: this.config.outputFormat,
      };

      result.encodedAudio = await getBase64Audio(response.AudioStream);
      return result;
    } catch (error) {
      console.log('Error', error);
    }

    return;
  }
}
