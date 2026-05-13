export type DetectedLanguage =
  | 'Tamil'
  | 'English'
  | 'Hindi'
  | 'Malayalam'
  | 'Telugu'
  | 'Kannada'
  | 'Punjabi'
  | 'Bengali'
  | 'Marathi'
  | 'Japanese'
  | 'Korean'
  | 'Arabic'
  | 'Spanish'
  | 'Unknown'

const englishIntentMap: Record<string, DetectedLanguage> = {
  tamil: 'Tamil',
  kollywood: 'Tamil',
  anirudh: 'Tamil',
  rahman: 'Tamil',
  yuvan: 'Tamil',
  malayalam: 'Malayalam',
  mollywood: 'Malayalam',
  hesham: 'Malayalam',
  sushin: 'Malayalam',
  hindi: 'Hindi',
  bollywood: 'Hindi',
  arijit: 'Hindi',
  telugu: 'Telugu',
  tollywood: 'Telugu',
  kannada: 'Kannada',
  sandalwood: 'Kannada',
  punjabi: 'Punjabi',
  bengali: 'Bengali',
  marathi: 'Marathi',
  japanese: 'Japanese',
  jpop: 'Japanese',
  korean: 'Korean',
  kpop: 'Korean',
  arabic: 'Arabic',
  spanish: 'Spanish',
  english: 'English',
  pop: 'English',
}

export function detectQueryLanguage(query: string): DetectedLanguage {
  const text = query.trim().toLowerCase()
  if (!text) return 'Unknown'

  if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil'
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi'
  if (/[\u0D00-\u0D7F]/.test(text)) return 'Malayalam'
  if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu'
  if (/[\u0C80-\u0CFF]/.test(text)) return 'Kannada'
  if (/[\u0A00-\u0A7F]/.test(text)) return 'Punjabi'
  if (/[\u0980-\u09FF]/.test(text)) return 'Bengali'
  if (/[\u3040-\u30FF\u31F0-\u31FF]/.test(text)) return 'Japanese'
  if (/[\uAC00-\uD7AF]/.test(text)) return 'Korean'
  if (/[\u0600-\u06FF]/.test(text)) return 'Arabic'

  for (const [keyword, language] of Object.entries(englishIntentMap)) {
    if (text.includes(keyword)) return language
  }

  return 'English'
}

export function enhanceMusicQuery(query: string, language: DetectedLanguage): string {
  const clean = query.trim()
  if (!clean) return clean

  const lower = clean.toLowerCase()
  const alreadyMusicIntent =
    lower.includes('song') ||
    lower.includes('songs') ||
    lower.includes('music') ||
    lower.includes('official') ||
    lower.includes('video')

  if (alreadyMusicIntent) return clean

  if (language !== 'Unknown' && language !== 'English') {
    return `${clean} ${language} official song`
  }

  return `${clean} official song`
}
