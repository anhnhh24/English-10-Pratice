import { VocabularyWord, DailyVocabSyncConfig } from '../types';
import { CURATED_VOCAB_BANK, VOCAB_CATEGORIES } from '../data/vocabCuratedBank';
import { getStoredApiKey, callGeminiApiWithFallback, AVAILABLE_MODELS } from './aiExamService';

const DAILY_VOCAB_CONFIG_KEY = 'edu10_daily_vocab_config';
const VOCAB_WORDS_KEY = 'edu10_vocab_words';
const DAILY_IMPORT_HISTORY_KEY = 'edu10_daily_vocab_history';

export const DEFAULT_DAILY_CONFIG: DailyVocabSyncConfig = {
  enabled: true,
  autoHour: 0, // 12h đêm (00:00) hàng ngày
  wordsPerBatch: 20,
  lastSyncDate: '',
  targetDifficulty: 'all',
  preferAiGeneration: true,
};

export function getStoredDailyVocabConfig(): DailyVocabSyncConfig {
  try {
    const raw = localStorage.getItem(DAILY_VOCAB_CONFIG_KEY);
    if (!raw) return DEFAULT_DAILY_CONFIG;
    return { ...DEFAULT_DAILY_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DAILY_CONFIG;
  }
}

export function saveDailyVocabConfig(config: DailyVocabSyncConfig): void {
  try {
    localStorage.setItem(DAILY_VOCAB_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save daily vocab config:', err);
  }
}

export function getStoredVocabularyWords(): VocabularyWord[] {
  try {
    const raw = localStorage.getItem(VOCAB_WORDS_KEY);
    if (!raw) {
      // Initialize with curated bank
      localStorage.setItem(VOCAB_WORDS_KEY, JSON.stringify(CURATED_VOCAB_BANK));
      return CURATED_VOCAB_BANK;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : CURATED_VOCAB_BANK;
  } catch {
    return CURATED_VOCAB_BANK;
  }
}

export function saveStoredVocabularyWords(words: VocabularyWord[]): void {
  try {
    localStorage.setItem(VOCAB_WORDS_KEY, JSON.stringify(words));
  } catch (err) {
    console.error('Failed to save vocabulary words:', err);
  }
}

/**
 * Get formatted current date string: 'YYYY-MM-DD'
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if the 12:00 PM daily import should run today
 */
export function shouldRunDailyVocabImport(config: DailyVocabSyncConfig): boolean {
  if (!config.enabled) return false;
  const today = getTodayDateString();
  if (config.lastSyncDate === today) return false;

  const currentHour = new Date().getHours();
  // Runs if current hour is >= autoHour (default 12)
  return currentHour >= config.autoHour;
}

/**
 * Pick 20 words for today's batch from the curated bank or smart rotation
 */
export function generateCuratedDailyBatch(
  existingWords: VocabularyWord[],
  dateStr: string,
  count = 20
): VocabularyWord[] {
  const existingWordTexts = new Set(existingWords.map((w) => w.word.toLowerCase().trim()));

  // Find candidate words in curated bank that are not in existing list
  const unusedCurated = CURATED_VOCAB_BANK.filter(
    (w) => !existingWordTexts.has(w.word.toLowerCase().trim())
  );

  let selected: VocabularyWord[] = [];

  if (unusedCurated.length >= count) {
    selected = unusedCurated.slice(0, count);
  } else {
    // If not enough unused words, pick from curated bank with new IDs
    selected = [...unusedCurated];
    const needed = count - selected.length;
    for (let i = 0; i < needed; i++) {
      const template = CURATED_VOCAB_BANK[i % CURATED_VOCAB_BANK.length];
      selected.push({
        ...template,
        id: `daily_${dateStr}_${i + 1}`,
      });
    }
  }

  // Tag all selected words with today's daily batch
  return selected.map((w, idx) => ({
    ...w,
    id: `daily_${dateStr.replace(/-/g, '')}_${idx + 1}`,
    dailyBatch: dateStr,
    dateAdded: new Date().toISOString(),
    source: 'ai_daily',
  }));
}

/**
 * AI-generated batch of 20 vocabulary words for Grade 9 Entrance Exam
 */
export async function generateVocabBatchWithAI(
  apiKey: string,
  count = 20,
  topic = 'All Units & Entrance Exam Topics',
  difficulty: 'easy' | 'medium' | 'hard' | 'all' = 'all',
  model = 'gemini-3.6-flash'
): Promise<VocabularyWord[]> {
  const today = getTodayDateString();
  const prompt = `Bạn là chuyên gia luyện thi Tiếng Anh vào Lớp 10 tại Việt Nam.
Hãy biên soạn đúng ${count} từ vựng TIẾNG ANH CHUẨN ÔN THI TUYỂN SINH VÀO LỚP 10 (theo chương trình SGK Lớp 9 thí điểm và cấu trúc đề thi tuyển sinh vào 10).

Yêu cầu chi tiết:
- Chủ đề: ${topic}
- Độ khó: ${difficulty === 'all' ? 'Tổng hợp (40% Cơ bản, 40% Khá, 20% Nâng cao/Chuyên)' : difficulty}
- Mỗi từ vựng phải có đầy đủ:
  + word: Từ tiếng Anh chuẩn xác
  + ipa: Phiên âm quốc tế chuẩn (ví dụ: /ˈkrɑːftsmən/)
  + partOfSpeech: 'noun' | 'verb' | 'adj' | 'adv' | 'phrasal_verb' | 'idiom' | 'collocation'
  + meaningVi: Nghĩa tiếng Việt ngắn gọn, xúc tích, sát đề thi
  + exampleEn: Câu ví dụ tiếng Anh tự nhiên, hay gặp trong đề thi vào 10
  + exampleVi: Dịch nghĩa câu ví dụ sang tiếng Việt
  + unit: Tên Unit hoặc Chuyên đề (ví dụ: 'Unit 1', 'Unit 2', 'Phrasal Verbs', 'Collocations')
  + theme: Tên chủ đề (ví dụ: 'Local Environment', 'City Life', 'Teen Stress')
  + difficulty: 'easy' | 'medium' | 'hard'
  + collocations: Danh sách 1-2 cụm từ thường đi kèm

ĐỊNH DẠNG TRẢ VỀ:
Trả về DUY NHẤT một mảng JSON hợp lệ, KHÔNG có văn bản giới thiệu, KHÔNG markdown bọc ngoài nếu có thể, dạng:
[
  {
    "word": "...",
    "ipa": "/.../",
    "partOfSpeech": "noun",
    "meaningVi": "...",
    "exampleEn": "...",
    "exampleVi": "...",
    "unit": "Unit 1",
    "theme": "Local Environment",
    "difficulty": "medium",
    "collocations": ["..."]
  }
]`;

  const { text: responseText } = await callGeminiApiWithFallback(apiKey, model, {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  });

  // Clean JSON block
  let jsonStr = responseText.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) {
    throw new Error('AI không trả về danh sách từ vựng hợp lệ.');
  }

  return parsed.map((item, idx) => ({
    id: `ai_vocab_${Date.now()}_${idx + 1}`,
    word: String(item.word || '').trim(),
    ipa: String(item.ipa || '').trim(),
    partOfSpeech: item.partOfSpeech || 'noun',
    meaningVi: String(item.meaningVi || '').trim(),
    exampleEn: String(item.exampleEn || '').trim(),
    exampleVi: String(item.exampleVi || '').trim(),
    unit: String(item.unit || 'Unit 1').trim(),
    theme: String(item.theme || topic).trim(),
    difficulty: item.difficulty || 'medium',
    collocations: Array.isArray(item.collocations) ? item.collocations : [],
    dateAdded: new Date().toISOString(),
    dailyBatch: today,
    source: 'ai_daily',
  }));
}

/**
 * Parse raw text (CSV, JSON, or Line-by-line) into VocabularyWord array
 */
export function parseVocabRawText(rawText: string): VocabularyWord[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // 1. Try JSON
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => ({
          id: `imp_${Date.now()}_${idx}`,
          word: String(item.word || '').trim(),
          ipa: String(item.ipa || '').trim(),
          partOfSpeech: item.partOfSpeech || 'noun',
          meaningVi: String(item.meaningVi || item.meaning || '').trim(),
          exampleEn: String(item.exampleEn || item.example || '').trim(),
          exampleVi: String(item.exampleVi || '').trim(),
          unit: String(item.unit || 'Chuyên Đề Tự Do').trim(),
          theme: String(item.theme || 'Từ vựng mở rộng').trim(),
          difficulty: item.difficulty || 'medium',
          collocations: Array.isArray(item.collocations) ? item.collocations : [],
          dateAdded: new Date().toISOString(),
          source: 'imported',
        }));
      }
    } catch {
      // Fall through to CSV/lines
    }
  }

  // 2. Try CSV / Tab-separated or Line-by-line
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const results: VocabularyWord[] = [];

  lines.forEach((line, idx) => {
    // Delimiters: tab, semicolon, comma, vertical bar |
    const delimiter = line.includes('\t')
      ? '\t'
      : line.includes(';')
      ? ';'
      : line.includes('|')
      ? '|'
      : ',';

    const parts = line.split(delimiter).map((p) => p.trim());
    if (parts.length >= 2) {
      const word = parts[0];
      const meaningVi = parts[1];
      const ipa = parts[2] || '';
      const partOfSpeech = (parts[3] as any) || 'noun';
      const exampleEn = parts[4] || '';
      const exampleVi = parts[5] || '';

      if (word && meaningVi) {
        results.push({
          id: `imp_${Date.now()}_${idx}`,
          word,
          meaningVi,
          ipa: ipa.startsWith('/') ? ipa : ipa ? `/${ipa}/` : '',
          partOfSpeech: ['noun', 'verb', 'adj', 'adv', 'phrasal_verb', 'idiom', 'collocation'].includes(partOfSpeech)
            ? partOfSpeech
            : 'noun',
          exampleEn,
          exampleVi,
          unit: 'Chuyên đề tự do',
          theme: 'Từ vựng mở rộng',
          difficulty: 'medium',
          dateAdded: new Date().toISOString(),
          source: 'imported',
        });
      }
    }
  });

  return results;
}
