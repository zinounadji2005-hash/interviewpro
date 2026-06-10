import Groq from "groq-sdk";
import { Buffer } from "node:buffer";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY must be set in environment variables");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Speech-to-Text: Transcribes audio using Groq's Whisper API
 */
export async function speechToText(
  audioBuffer: Buffer,
  format: "wav" | "mp3" | "webm" = "webm"
): Promise<string> {
  try {
    // Groq SDK - create File from buffer
    // Note: Groq may require specific file format handling
    const { toFile } = await import("openai");
    const file = await toFile(audioBuffer, `audio.${format}`);

    const transcription = await groq.audio.transcriptions.create({
      file: file as any,
      model: "whisper-large-v3",
      language: "en",
      response_format: "text",
    });

    return transcription as string;
  } catch (error) {
    console.error("Groq STT error:", error);
    // Fallback: Use OpenAI Whisper if Groq fails
    if (process.env.OPENAI_API_KEY) {
      try {
        const OpenAI = await import("openai");
        const openai = new OpenAI.default({
          apiKey: process.env.OPENAI_API_KEY,
        });
        const { toFile } = await import("openai");
        const file = await toFile(audioBuffer, `audio.${format}`);
        const response = await openai.audio.transcriptions.create({
          file,
          model: "whisper-1",
        });
        return response.text;
      } catch (fallbackError) {
        console.error("OpenAI STT fallback error:", fallbackError);
      }
    }
    throw new Error("Failed to transcribe audio");
  }
}

/**
 * Text-to-Speech: Converts text to speech using Groq's TTS API
 * Note: Groq doesn't have native TTS, so we'll use OpenAI's TTS as fallback
 * or you can integrate with another TTS service like ElevenLabs, Google TTS, etc.
 */
export async function textToSpeech(
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "nova",
  format: "wav" | "mp3" | "flac" | "opus" | "pcm16" = "mp3"
): Promise<Buffer> {
  // Groq doesn't have TTS API yet, so we'll use OpenAI as fallback
  // You can replace this with another TTS service if preferred
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = await import("openai");
    const openai = new OpenAI.default({
      apiKey: process.env.OPENAI_API_KEY,
    });

    try {
      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice,
        input: text,
        response_format: format === "mp3" ? "mp3" : "opus",
      });

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("OpenAI TTS error:", error);
      throw new Error("Failed to synthesize speech");
    }
  } else {
    // Fallback: return empty buffer or throw error
    throw new Error("TTS requires OPENAI_API_KEY or another TTS service. Groq doesn't support TTS yet.");
  }
}

/**
 * Streaming Speech-to-Text: Transcribes audio with real-time streaming
 */
export async function speechToTextStream(
  audioBuffer: Buffer,
  format: "wav" | "mp3" | "webm" = "webm"
): Promise<AsyncIterable<string>> {
  // Groq doesn't support streaming STT yet, so we'll return a simple async generator
  const text = await speechToText(audioBuffer, format);
  
  return (async function* () {
    // Simulate streaming by yielding chunks
    const words = text.split(" ");
    for (const word of words) {
      yield word + " ";
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for streaming effect
    }
  })();
}

/**
 * Streaming Text-to-Speech: Converts text to speech with real-time streaming
 */
export async function textToSpeechStream(
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "nova"
): Promise<AsyncIterable<string>> {
  // Use OpenAI streaming TTS as Groq doesn't support TTS
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = await import("openai");
    const openai = new OpenAI.default({
      apiKey: process.env.OPENAI_API_KEY,
    });

    try {
      const stream = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice,
        input: text,
        response_format: "opus",
      });

      return (async function* () {
        const reader = stream.body?.getReader();
        if (!reader) throw new Error("No reader available");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield Buffer.from(value).toString("base64");
        }
      })();
    } catch (error) {
      console.error("OpenAI streaming TTS error:", error);
      throw new Error("Failed to stream speech");
    }
  } else {
    throw new Error("Streaming TTS requires OPENAI_API_KEY. Groq doesn't support TTS yet.");
  }
}
