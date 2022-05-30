import { App } from '@jovotech/framework';
import { CorePlatform } from '@jovotech/platform-core';
// import { WebPlatform } from '@jovotech/platform-web';

import { GlobalComponent } from './components/GlobalComponent';
import { LoveHatePizzaComponent } from './components/LoveHatePizzaComponent';
import { PollyTts, S3TtsCache } from './plugins/tts-polly';
// import { SimpleTtsCache } from './SimpleTtsCache';


/*
|--------------------------------------------------------------------------
| APP CONFIGURATION
|--------------------------------------------------------------------------
|
| All relevant components, plugins, and configurations for your Jovo app
| Learn more here: www.jovo.tech/docs/app-config
|
*/
const app = new App({
  /*
  |--------------------------------------------------------------------------
  | Components
  |--------------------------------------------------------------------------
  |
  | Components contain the Jovo app logic
  | Learn more here: www.jovo.tech/docs/components
  |
  */
  components: [GlobalComponent, LoveHatePizzaComponent],

  /*
  |--------------------------------------------------------------------------
  | Plugins
  |--------------------------------------------------------------------------
  |
  | Includes platforms, database integrations, third-party plugins, and more
  | Learn more here: www.jovo.tech/marketplace
  |
  */
  plugins: [
    new CorePlatform({
      plugins: [
        new PollyTts({
          region: 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_ID as string,
            secretAccessKey: process.env.AWS_SECRET as string,
          },
          includeEncodedAudio: true,
          cache: new S3TtsCache({
            region: 'us-east-1',
            credentials: {
              accessKeyId: process.env.AWS_ID as string,
              secretAccessKey: process.env.AWS_SECRET as string,
            },
            bucket: 'my-bucket-public',
            path: 'polly-tts/audio',
            baseUrl: 'https://my-bucket-public.s3.amazonaws.com',
            returnEncodedAudio: false,
          }),
          // cache: new SimpleTtsCache({})
        }),
      ]
    })
  ],

  /*
  |--------------------------------------------------------------------------
  | Other options
  |--------------------------------------------------------------------------
  |
  | Includes all other configuration options like logging
  | Learn more here: www.jovo.tech/docs/app-config
  |
  */
  logging: true,
});

export { app };
