/**
 * AI Sentence Transformation / Rewriting Evaluation Service
 * Grades student essay sentences for Grade 10 Entrance Exam preparation with pedagogical feedback
 */
import { SentenceRewriteProblem, SentenceGradingResult } from '../types';
import { callGeminiApiWithFallback, getStoredApiKey } from './aiExamService';

/**
 * Normalizes text for offline exact/fuzzy comparison (removes punctuation, excess spaces, lowercase, standardizes quotes)
 */
function normalizeSentence(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/’/g, "'")
    .replace(/n't/g, " not")
    .replace(/'ll/g, " will")
    .replace(/'ve/g, " have")
    .replace(/'re/g, " are")
    .replace(/'d/g, " would")
    .replace(/'m/g, " am");
}

/**
 * Offline rule-based grading fallback when AI key is missing or offline
 */
export function evaluateSentenceRewriteOffline(
  problem: SentenceRewriteProblem,
  studentInput: string
): SentenceGradingResult {
  const cleanInput = studentInput.trim();
  if (!cleanInput) {
    return {
      isCorrect: false,
      score: 0,
      status: 'incorrect',
      feedback: 'Bạn chưa nhập câu trả lời.',
      grammarAnalysis: problem.grammarStructure,
      alternativeAnswers: problem.acceptableVariations,
      standardKey: problem.standardKey,
    };
  }

  // Check if student included givenBeginning or just the continuation
  let fullStudentSentence = cleanInput;
  if (problem.givenBeginning && !cleanInput.toLowerCase().startsWith(problem.givenBeginning.toLowerCase())) {
    fullStudentSentence = `${problem.givenBeginning.trim()} ${cleanInput}`;
  }

  const normStudent = normalizeSentence(fullStudentSentence);
  const normKey = normalizeSentence(problem.standardKey);
  const normVariations = problem.acceptableVariations.map(normalizeSentence);

  // Exact or variation match
  if (normStudent === normKey || normVariations.includes(normStudent)) {
    return {
      isCorrect: true,
      score: 10,
      status: 'perfect',
      feedback: '🎉 Xuất sắc! Câu viết lại hoàn toàn chính xác về ngữ pháp, thì và ngữ nghĩa chuẩn cấu trúc thi vào 10.',
      grammarAnalysis: `✅ Áp dụng đúng quy tắc: ${problem.grammarStructure}`,
      alternativeAnswers: problem.acceptableVariations,
      standardKey: problem.standardKey,
      correctedFullSentence: problem.standardKey,
    };
  }

  // Partial match: similarity check
  const studentWords = normStudent.split(' ');
  const keyWords = normKey.split(' ');
  const matchedWords = studentWords.filter((w) => keyWords.includes(w));
  const similarity = matchedWords.length / Math.max(studentWords.length, keyWords.length);

  if (similarity >= 0.75) {
    return {
      isCorrect: false,
      score: 6.5,
      status: 'minor_error',
      feedback: '⚠️ Câu của bạn đã gần đúng nhưng có thể còn sai sót nhỏ về mạo từ, giới từ, thì hoặc biến đổi từ.',
      grammarAnalysis: `🔍 Cấu trúc chuẩn: ${problem.grammarStructure}. ${problem.commonTraps}`,
      alternativeAnswers: problem.acceptableVariations,
      standardKey: problem.standardKey,
      correctedFullSentence: problem.standardKey,
    };
  }

  return {
    isCorrect: false,
    score: 0,
    status: 'incorrect',
    feedback: '❌ Chưa chính xác. Hãy xem kỹ cấu trúc chuẩn và lưu ý bẫy ngữ pháp dưới đây nhé!',
    grammarAnalysis: `🔍 Cấu trúc chuẩn: ${problem.grammarStructure}. ${problem.commonTraps}`,
    alternativeAnswers: problem.acceptableVariations,
    standardKey: problem.standardKey,
    correctedFullSentence: problem.standardKey,
  };
}

/**
 * AI-powered sentence rewrite grading with deep linguistic and exam-oriented feedback
 */
export async function evaluateSentenceRewriteWithAI(
  problem: SentenceRewriteProblem,
  studentInput: string,
  apiKeyParam?: string
): Promise<SentenceGradingResult> {
  const apiKey = (apiKeyParam || getStoredApiKey()).trim();

  // If no API key, use instant offline evaluation
  if (!apiKey) {
    return evaluateSentenceRewriteOffline(problem, studentInput);
  }

  const cleanInput = studentInput.trim();
  if (!cleanInput) {
    return evaluateSentenceRewriteOffline(problem, studentInput);
  }

  // Combine full sentence if student only typed the ending
  let fullStudentSentence = cleanInput;
  if (problem.givenBeginning && !cleanInput.toLowerCase().startsWith(problem.givenBeginning.toLowerCase().slice(0, 5))) {
    fullStudentSentence = `${problem.givenBeginning.trim()} ${cleanInput}`;
  }

  const prompt = `Bạn là Giám khảo chấm thi Tuyển sinh môn Tiếng Anh vào Lớp 10 tại Việt Nam.
Hãy chấm điểm và nhận xét chi tiết câu Tự Luận Viết Lại Câu (Sentence Transformation) của học sinh sau đây:

--- THÔNG TIN CÂU HỎI ---
- Câu gốc: "${problem.originalSentence}"
- Từ bắt đầu cho sẵn (Given Beginning): "${problem.givenBeginning || 'Không có'}"
- Từ gợi ý trong ngoặc (Keyword): "${problem.keyword || 'Không có'}"
- Đáp án chuẩn (Standard Key): "${problem.standardKey}"
- Các phương án chấp nhận khác: ${JSON.stringify(problem.acceptableVariations)}
- Cấu trúc ngữ pháp trọng tâm: "${problem.grammarStructure}"
- Bẫy đề thi hay gặp: "${problem.commonTraps}"

--- BÀI LÀM CỦA HỌC SINH ---
- Câu học sinh đã viết: "${fullStudentSentence}" (Phần học sinh nhập vào: "${cleanInput}")

--- YÊU CẦU ĐÁNH GIÁ ---
Chấm điểm theo thang điểm 10 (thập phân 0.5, từ 0 đến 10 điểm):
- 10/10 (perfect): Đúng 100% ngữ pháp, từ vựng, chia thì, chính tả, giữ nguyên nghĩa gốc.
- 8.0 - 9.5 (acceptable): Đúng nghĩa và ngữ pháp, nhưng có thể cải thiện cách dùng từ cho tự nhiên hơn hoặc có cách viết tương đương hợp lệ.
- 4.0 - 7.5 (minor_error): Đúng hướng cấu trúc nhưng sai nhỏ về mạo từ (a/an/the), giới từ, chia động từ số ít/nhiều, hoặc thiếu tân ngữ phụ.
- 0 - 3.5 (incorrect): Sai cấu trúc chính, sai nghĩa câu gốc, hoặc sai ngữ pháp nghiêm trọng.

BẮT BUỘC trả về định dạng JSON thuần túy (không kèm markdown \`\`\`json):
{
  "isCorrect": true,
  "score": 10.0,
  "status": "perfect",
  "feedback": "Lời nhận xét động viên và giải thích rõ vì sao đúng hoặc điểm trừ cụ thể bằng tiếng Việt dễ hiểu",
  "grammarAnalysis": "Phân tích cấu trúc chuyển đổi chuẩn và lưu ý bẫy ngữ pháp",
  "highlightedMistakes": [
    {
      "word": "từ/cụm từ học sinh viết sai",
      "correction": "sửa lại thành",
      "reason": "lý do sửa"
    }
  ],
  "alternativeAnswers": ["Các cách viết tương đương đúng khác"],
  "standardKey": "${problem.standardKey}",
  "correctedFullSentence": "Câu hoàn chỉnh đúng ngữ pháp"
}`;

  try {
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };

    const { text } = await callGeminiApiWithFallback(apiKey, 'gemini-3.5-flash-lite', payload);
    const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed: SentenceGradingResult = JSON.parse(cleanedText);

    return {
      isCorrect: Boolean(parsed.isCorrect),
      score: typeof parsed.score === 'number' ? parsed.score : parsed.isCorrect ? 10 : 0,
      status: parsed.status || (parsed.isCorrect ? 'perfect' : 'incorrect'),
      feedback: parsed.feedback || 'Đã hoàn thành đánh giá bài viết.',
      grammarAnalysis: parsed.grammarAnalysis || problem.grammarStructure,
      highlightedMistakes: Array.isArray(parsed.highlightedMistakes) ? parsed.highlightedMistakes : [],
      alternativeAnswers: Array.isArray(parsed.alternativeAnswers) && parsed.alternativeAnswers.length > 0
        ? parsed.alternativeAnswers
        : problem.acceptableVariations,
      standardKey: problem.standardKey,
      correctedFullSentence: parsed.correctedFullSentence || problem.standardKey,
    };
  } catch (err) {
    console.warn('AI Grading failed, using offline fallback:', err);
    return evaluateSentenceRewriteOffline(problem, studentInput);
  }
}

/**
 * AI tool to lookup vocabulary and auto-populate flashcard fields
 */
export async function generateSentenceVocabInfoWithAI(
  wordOrPhrase: string,
  contextSentence?: string,
  apiKeyParam?: string
): Promise<{
  word: string;
  ipa: string;
  partOfSpeech: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  category: string;
}> {
  const apiKey = (apiKeyParam || getStoredApiKey()).trim();
  const cleanWord = wordOrPhrase.trim();

  // Fallback defaults if no API key
  const fallback = {
    word: cleanWord,
    ipa: '',
    partOfSpeech: 'noun',
    meaningVi: '',
    exampleEn: contextSentence || `I learned the word "${cleanWord}" today.`,
    exampleVi: `Tôi đã học từ "${cleanWord}" hôm nay.`,
    category: 'Entrance Exam Vocab',
  };

  if (!apiKey || !cleanWord) return fallback;

  const prompt = `Bạn là từ điển chuyên ngành Luyện thi Tiếng Anh vào Lớp 10 tại Việt Nam.
Hãy tra cứu từ/cụm từ sau đây và trả về định dạng JSON thuần túy (không kèm markdown \`\`\`json):
Từ cần tra: "${cleanWord}"
${contextSentence ? `Ngữ cảnh trong câu đề thi: "${contextSentence}"` : ''}

Yêu cầu trả về JSON chính xác:
{
  "word": "${cleanWord}",
  "ipa": "Phiên âm quốc tế chuẩn IPA, ví dụ /ˈkrɑːftsmən/",
  "partOfSpeech": "noun" | "verb" | "adj" | "adv" | "phrasal_verb" | "idiom" | "collocation",
  "meaningVi": "Nghĩa tiếng Việt ngắn gọn, súc tích, sát với đề thi tuyển sinh vào 10",
  "exampleEn": "Câu ví dụ tiếng Anh tự nhiên chứa từ này (ưu tiên câu từ ngữ cảnh nếu có)",
  "exampleVi": "Dịch nghĩa câu ví dụ sang tiếng Việt",
  "category": "Chuyên đề phù hợp, ví dụ 'Local Environment', 'City Life', 'Phrasal Verbs', 'Grammar Structures'"
}`;

  try {
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    };

    const { text } = await callGeminiApiWithFallback(apiKey, 'gemini-3.5-flash-lite', payload);
    const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    return {
      word: parsed.word || cleanWord,
      ipa: parsed.ipa || '',
      partOfSpeech: parsed.partOfSpeech || 'noun',
      meaningVi: parsed.meaningVi || '',
      exampleEn: parsed.exampleEn || contextSentence || '',
      exampleVi: parsed.exampleVi || '',
      category: parsed.category || 'Entrance Exam Vocab',
    };
  } catch (err) {
    console.warn('AI Vocab lookup failed:', err);
    return fallback;
  }
}
