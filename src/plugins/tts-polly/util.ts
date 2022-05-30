import { Readable } from 'stream';
import * as streams from 'memory-streams';

export function getBase64Audio(reader: Readable): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const writer = new streams.WritableStream();

    reader.on('end', () => {
      const buff = writer.toBuffer();
      const value = buff.toString('base64');

      resolve(value);
    });

    reader.on('error', (e) => {
      reject(e);
    });

    reader.pipe(writer);
  });
}
