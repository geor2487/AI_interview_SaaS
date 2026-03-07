import { openai } from './client'

export async function transcribeAudio(
  audioBuffer: Buffer,
  language: string = 'ja'
): Promise<string> {
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/webm' })
  const file = new File([blob], 'audio.webm', { type: 'audio/webm' })

  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language,
  })

  return transcription.text
}
