# TTS Proposal

The proposal is for a `$tts` object that is created during the `response.tts` middleware. It's job is to look at the platform-specific `$response` and interate all speech/text items that can be replaced with one or more audio files through a TTS provider such as Polly.

In the `before.response.end` middleware, this `$tts` object would be used to update the `$response` with the audio info. For each entry, this audio info could be a single item or an array of items.

For a given entry in the `$tts` object, if there are multiple `audio` items, a plugin for the `after.response.tts` middleware could use FFmpeg to combine all the audios from `$tts` into a single audio entry. This is not required. Developers may choose to pass the array of audio URLs to the client for it to play on a speaker.

## Example 1 - Simple

The `$output` is used to create a platform-specific `$response`. Random selection from multiple messages or reprompts and combination of multiple outputs into one response happens here.

- middleware: `response.output`

```json
// $response
{
  "version": "4.0.0",
  "platform": "web",
  "output": [
    {
      "message": "You can say 'switch to dark mode' or 'light mode.'",
      "reprompt": "Dark or light mode?",
      "listen": false
    }
  ]
}
```

Iterate through `$response` for each spoken item. Call the configured TTS provider (such as Polly) and create web URLs for any audio generated.

- middleware: `response.tts`

```json
// $tts
[
  {
    "type": "message",
    "speech": "You can say 'switch to dark mode' or 'light mode.'",
    "audio": "https://example.com/tts1.mp3"
  },
  {
    "type": "reprompt",
    "speech": "Dark or light mode?",
    "audio": "https://example.com/tts2.mp3"
  }
]
```

Iterate through `$tts` and update `$response`.

- middleware: `before.response.end`

```json
// $response (updated)
{
  "version": "4.0.0",
  "platform": "web",
  "output": [
    {
      "message": {
        "speech": "You can say 'switch to dark mode' or 'light mode.'",
        "audio": "https://example.com/tts1.mp3"
      },
      "reprompt": {
        "speech": "Dark or light mode?",
        "audio": "https://example.com/tts2.mp3"
      },
      "listen": false
    }
  ]
}
```

## Example 2 - SFX Audio and TTS Audio

The `$output` is used to create a platform-specific `$response`. Random selection from multiple messages or reprompts and combination of multiple outputs into one response happens here.

In this case, the message has two audio tags and two sections of spoken text. The "What next?" text is shared between message and reprompt so TTS will only need to occur once.

If the TTS provider (Polly) supports SSML, the text parts can contain TTS-provider allowed markup.

NOTE: Polly doesn't support the <audio> tag, but the TTS providers can provide a way to include audio for music, voice overs and SFX.

- middleware: `response.output`

```json
// $response
{
  "version": "4.0.0",
  "platform": "web",
  "output": [
    {
      "message": "<audio src=\"https://example.com/sfx1.mp3\"/>Hello Jovo<audio src=\"https://example.com/sfx2.mp3\"/>What next?",
      "reprompt": "What next?",
      "listen": true
    }
  ]
}
```

Iterate through `$response` for each spoken item. Call the configured TTS provider (such as Polly) and create web URLs for any audio generated.

The complete speech text is included and split into <audio> and tts parts. Because no `text` was specified and there is SSML in the `message`, then a `message.text` is added that strips that <audio> tags.

- middleware: `response.tts`

```json
// $tts
[
  {
    "type": "message",
    "speech": "<audio src=\"https://example.com/sfx1.mp3\"/>Hello Jovo!<audio src=\"https://example.com/sfx2.mp3\"/>What next?",
    "audio": [
      {
        "type": "audioTag",
        "speech": "<audio src=\"https://example.com/sfx1.mp3\"/>",
        "url": "https://example.com/sfx1.mp3"
      },
      {
        "type": "tts",
        "speech": "Hello Jovo!",
        "url": "https://example.com/tts1.mp3"
      },
      {
        "type": "audioTag",
        "speech": "<audio src=\"https://example.com/sfx2.mp3\"/>",
        "url": "https://example.com/sfx2.mp3"
      },
      {
        "type": "tts",
        "speech": "What next?",
        "url": "https://example.com/tts2.mp3"
      }
    ]
  },
  {
    "type": "reprompt",
    "speech": "What next?",
    "audio": "https://example.com/tts2.mp3"
  }
]
```

Iterate through `$tts` and update `$response`.

In this case the developer has configured it so that multiple audio urls will be returned to the client.

- middleware: `before.response.end`

```json
// $response (updated)
{
  "version": "4.0.0",
  "platform": "web",
  "output": [
    {
      "message": {
        "speech": "<audio src=\"https://example.com/sfx1.mp3\"/>Hello Jovo!<audio src=\"https://example.com/sfx2.mp3\"/>What next?",
        "text": "Hello Jovo! What next?",
        "audio": [
          "https://example.com/sfx1.mp3",
          "https://example.com/tts1.mp3",
          "https://example.com/sfx2.mp3",
          "https://example.com/tts2.mp3"
        ]
      },
      "reprompt": {
        "speech": "What next?",
        "audio": "https://example.com/tts2.mp3"
      },
      "listen": true
    }
  ]
}
```

## Example 3 - Process multiple audio files into a single web URL

The example builds on Example 2 by adding a middleware that uses FFmpeg to combine multiple audio URLs into a single web URL.

The same `TtsCache` implementation that was used to process and generate TTS could be used by this FFmpeg plugin to store the combined audio file. The input to the hash would be the `speech` property for the response entry.

- middleware: `after.response.tts`

```json
// $tts (updated)
[
  {
    "type": "message",
    "speech": "<audio src=\"https://example.com/sfx1.mp3\"/>Hello Jovo!<audio src=\"https://example.com/sfx2.mp3\"/>What next?",
    "audio": "https://example.com/combined1.mp3"
  },
  {
    "type": "reprompt",
    "speech": "What next?",
    "audio": "https://example.com/tts2.mp3"
  }
]
```

This then affects the update to the `$response` object.

- middleware: `before.response.end`

```json
// $response (updated)
{
  "version": "4.0.0",
  "platform": "web",
  "output": [
    {
      "message": {
        "speech": "<audio src=\"https://example.com/sfx1.mp3\"/>Hello Jovo!<audio src=\"https://example.com/sfx2.mp3\"/>What next?",
        "text": "Hello Jovo! What next?",
        "audio": "https://example.com/combined1.mp3"
      },
      "reprompt": {
        "speech": "What next?",
        "audio": "https://example.com/tts2.mp3"
      },
      "listen": true
    }
  ]
}
```
