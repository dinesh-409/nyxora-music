export const APP_NAME = 'Nyxora Music'
export const FALLBACK_COVER = '/logo.png'

export const SUPPORTED_LANGUAGES = [
  'Tamil',
  'English',
  'Hindi',
  'Malayalam',
  'Telugu',
  'Kannada',
  'Punjabi',
  'Bengali',
  'Marathi',
  'Japanese',
  'Korean',
  'Arabic',
  'Spanish',
]

export const DEFAULT_ARTISTS_BY_LANGUAGE: Record<string, string[]> = {
  Tamil: [
    'A.R. Rahman',
    'Anirudh',
    'Yuvan Shankar Raja',
    'Ilaiyaraaja',
    'Sid Sriram',
    'Shreya Ghoshal',
    'Santhosh Narayanan',
  ],
  Malayalam: [
    'Hesham Abdul Wahab',
    'Sushin Shyam',
    'Vineeth Sreenivasan',
    'K.S. Chithra',
  ],
  Hindi: ['Arijit Singh', 'Shreya Ghoshal', 'Pritam', 'Vishal-Shekhar'],
  English: ['Taylor Swift', 'The Weeknd', 'Ed Sheeran', 'Billie Eilish'],
  Telugu: ['Sid Sriram', 'S. Thaman', 'Devi Sri Prasad', 'Anirudh'],
  Kannada: ['Vijay Prakash', 'Arjun Janya', 'Sonu Nigam', 'Shreya Ghoshal'],
}
