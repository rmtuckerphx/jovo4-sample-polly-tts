import { DeepPartial } from '@jovotech/framework';
import { TtsData } from '../TtsData';
import { BaseTtsCache, TtsCacheConfig } from './BaseTtsCache';
import type { Credentials } from '@aws-sdk/types';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  HeadObjectCommand,
  HeadObjectCommandInput,
  GetObjectCommand,
  GetObjectCommandInput,
  GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { getBase64Audio } from '../util';

export interface S3TtsCacheConfig extends TtsCacheConfig {
  credentials: Credentials;
  region: string;
  bucket: string;
  path: string;
  baseUrl: string;
}

export type S3TtsCacheInitConfig = DeepPartial<S3TtsCacheConfig> &
  Pick<S3TtsCacheConfig, 'credentials' | 'region' | 'bucket' | 'baseUrl'>;

export class S3TtsCache extends BaseTtsCache<S3TtsCacheConfig> {
  readonly client: S3Client;

  constructor(config: S3TtsCacheInitConfig) {
    super(config);

    this.client = new S3Client({
      credentials: this.config.credentials,
      region: this.config.region,
    });
  }

  getDefaultConfig(): S3TtsCacheConfig {
    return {
      region: '',
      credentials: {
        accessKeyId: '',
        secretAccessKey: '',
      },
      bucket: '',
      path: '',
      baseUrl: '',
      returnEncodedAudio: false,
    };
  }

  async getCacheData(
    key: string,
    locale: string,
    outputFormat: string,
  ): Promise<TtsData | undefined> {
    let command: HeadObjectCommand | GetObjectCommand;
    const filePath = this.getFilePath(key, locale, outputFormat);

    if (this.config.returnEncodedAudio) {
      command = this.buildGetCommand(filePath);
    } else {
      command = this.buildHeadCommand(filePath);
    }

    try {
      const response = await this.client.send(command);

      const body = (response as GetObjectCommandOutput).Body;
      if (body) {
        const result: TtsData = {
          contentType: response.ContentType,
          url: urlJoin(this.config.baseUrl, filePath),
        };

        result.encodedAudio = await getBase64Audio(body);

        return result;
      }

      if (response.ContentType) {
        return {
          contentType: response.ContentType,
          url: urlJoin(this.config.baseUrl, filePath),
        };
      }
    } catch (error) {
      console.log('Error', error);
    }

    // object couldn't be retrieved from cache
    return;
  }

  private buildHeadCommand(filePath: string) {
    const params: HeadObjectCommandInput = {
      Bucket: this.config.bucket,
      Key: filePath,
    };

    const command = new HeadObjectCommand(params);
    return command;
  }

  private buildGetCommand(filePath: string) {
    const params: GetObjectCommandInput = {
      Bucket: this.config.bucket,
      Key: filePath,
    };

    const command = new GetObjectCommand(params);
    return command;
  }

  async storeCacheData(key: string, locale: string, data: TtsData): Promise<void> {
    if (!data.encodedAudio) {
      return;
    }

    const filePath = this.getFilePath(key, locale, data.fileExtension);
    const body = Buffer.from(data.encodedAudio, 'base64');

    const params: PutObjectCommandInput = {
      Bucket: this.config.bucket,
      Key: filePath,
      Body: body,
      ContentType: data.contentType,
      ACL: 'public-read',
    };

    const command = new PutObjectCommand(params);

    try {
      await this.client.send(command);
    } catch (error) {
      console.log('Error', error);
    }
  }

  private getFilePath(key: string, locale: string, extension?: string) {
    const filename = extension ? `${key}.${extension}` : key;
    const filePath = urlJoin(this.config.path, locale, filename);
    return filePath;
  }
}

function urlJoin(...parts: string[]): string {
  let result = parts.join('/');
  result = result.replace('//', '/');
  return result;
}
