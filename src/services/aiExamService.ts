import { Question, Exam, TopicId, SubTopicId, DifficultyLevel } from '../types';

export interface ExamGenerationConfig {
  title?: string;
  targetProvince?: string;
  difficulty: 'standard' | 'advanced' | 'challenge';
  totalQuestions: number;
  timeLimitMinutes: number;
  focusTopics?: TopicId[];
  customPrompt?: string;
  modelName?: string;
}

export interface GeneratedExamResult {
  exam: Exam;
  questions: Question[];
}

export const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Khuyên dùng - Nhanh & Chuẩn nhất)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Ổn định, tốc độ cao)' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Thế hệ mới)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Suy luận sâu cho đề chuyên)' },
];

export const getStoredApiKey = (): string => {
  return localStorage.getItem('edu10_gemini_api_key') || '';
};

export const setStoredApiKey = (key: string): void => {
  localStorage.setItem('edu10_gemini_api_key', key.trim());
};

export const clearStoredApiKey = (): void => {
  localStorage.removeItem('edu10_gemini_api_key');
};

/**
 * Kiểm tra tính hợp lệ của API Key
 */
export async function testGeminiApiKey(apiKey: string, model: string = 'gemini-2.5-flash'): Promise<{ success: boolean; message: string }> {
  if (!apiKey || apiKey.trim() === '') {
    return { success: false, message: 'Vui lòng nhập API Key trước khi kiểm tra.' };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello, reply with "OK".' }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || response.statusText;
      return { success: false, message: `Lỗi kết nối API (${response.status}): ${errorMsg}` };
    }

    return { success: true, message: 'API Key hoạt động hoàn hảo!' };
  } catch (err: any) {
    return { success: false, message: `Lỗi mạng hoặc kết nối: ${err.message || 'Không xác định'}` };
  }
}

/**
 * Tạo đề thi Tiếng Anh vào lớp 10 bằng Gemini API
 */
export async function generateExamWithAI(
  apiKey: string,
  config: ExamGenerationConfig,
  onProgressUpdate?: (step: string) => void
): Promise<GeneratedExamResult> {
  const effectiveKey = apiKey.trim() || getStoredApiKey();
  if (!effectiveKey) {
    throw new Error('Chưa cung cấp Gemini API Key. Vui lòng nhập API Key để tiếp tục.');
  }

  const model = config.modelName || 'gemini-2.5-flash';

  onProgressUpdate?.('Đang phân tích ma trận đề thi & xây dựng câu hỏi chuẩn form vào 10...');

  const systemInstruction = `Bạn là một chuyên gia khảo thí và giáo viên luyện thi môn Tiếng Anh vào lớp 10 THPT hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là biên soạn một đề thi trắc nghiệm Tiếng Anh tuyển sinh vào lớp 10 bám sát tuyệt đối chương trình GDPT hiện hành và ma trận đề thi của các Sở Giáo dục và Đào tạo (Hà Nội, TP.HCM, Đà Nẵng,...).

YÊU CẦU DỮ LIỆU ĐẦU RA (JSON FORMAT):
Bạn PHẢI trả về duy nhất một chuỗi JSON hợp lệ không bọc thêm bất kỳ văn bản giải thích nào ngoài JSON.
Cấu trúc JSON bắt buộc:
{
  "title": "Tên đề thi (ví dụ: Đề Thi Thử Vào 10 - Bứt Phá Ngữ Pháp & Biến Đổi Câu)",
  "code": "Mã đề (ví dụ: TS10-AI-${Math.floor(100 + Math.random() * 900)})",
  "description": "Mô tả ngắn gọn về ma trận và độ khó của đề",
  "targetProvince": "Chuẩn Sở GD&ĐT / Mục tiêu điểm",
  "difficulty": "${config.difficulty}",
  "timeLimitMinutes": ${config.timeLimitMinutes},
  "questions": [
    {
      "topicId": "grammar | vocabulary | pronunciation | stress | reading | sentence_rewrite | cloze | error_identification",
      "subTopicId": "tenses | passive_voice | reported_speech | conditionals | relative_clauses | comparisons | wish_clauses | gerund_infinitive | tag_questions | modal_verbs | phrasal_verbs | prepositions | pronunciation_s_es | pronunciation_ed | pronunciation_vowels | stress_2_syllables | stress_3_syllables | vocab_environment | vocab_city_life | vocab_teen_stress | vocab_past_life | vocab_wonders | vocab_space | rewrite_conditionals | rewrite_passive | rewrite_reported | rewrite_connectors | rewrite_so_such | rewrite_too_enough | reading_comprehension | cloze_test | find_error",
      "difficulty": "easy | medium | hard | expert",
      "content": "Nội dung câu hỏi bằng tiếng Anh (hoặc yêu cầu chọn từ có phần gạch chân phát âm khác, chọn câu đồng nghĩa, v.v.)",
      "passage": "Đoạn văn đọc hiểu hoặc bài đọc điền từ (nếu là câu hỏi thuộc phần reading hoặc cloze, các câu cùng bài đọc thì điền cùng nội dung passage này)",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctOption": 0, // Số nguyên từ 0 đến 3 tương ứng với A, B, C, D
      "explanation": "Giải thích chi tiết bằng tiếng Việt vì sao chọn đáp án này và vì sao các đáp án khác sai.",
      "grammarRule": "Quy tắc ngữ pháp hoặc công thức áp dụng (ví dụ: 'Câu điều kiện loại 2: If + S + V-ed/2, S + would + V-inf')",
      "commonMistakeTip": "Mẹo tránh bẫy câu hỏi hoặc lỗi học sinh hay mắc phải",
      "translation": "Dịch toàn bộ câu hỏi và đáp án sang tiếng Việt chuẩn xác"
    }
  ]
}

LƯU Ý CỰC KỲ QUAN TRỌNG:
1. Đảm bảo đúng chính xác ${config.totalQuestions} câu hỏi trong mảng 'questions'.
2. Các đáp án trong 'options' phải bắt đầu bằng 'A. ', 'B. ', 'C. ', 'D. '.
3. 'correctOption' phải là số index (0 cho A, 1 cho B, 2 cho C, 3 cho D).
4. Lời giải 'explanation', 'grammarRule', 'commonMistakeTip', 'translation' phải cực kỳ chi tiết, dễ hiểu, chuẩn văn phong sư phạm Việt Nam.`;

  const userPrompt = `Hãy tạo một đề thi Tiếng Anh vào lớp 10 với các thông số sau:
- Tên đề (gợi ý): ${config.title || 'Đề Thi Thử Tiếng Anh Vào 10 - Tạo bởi AI'}
- Độ khó: ${config.difficulty === 'challenge' ? 'Nâng cao / Chuyên Anh (Mục tiêu 9-10đ)' : config.difficulty === 'advanced' ? 'Khá - Giỏi (Mục tiêu 8-8.5đ)' : 'Cơ bản - Chuẩn đề chung (Mục tiêu 7-8đ)'}
- Số lượng câu hỏi: ${config.totalQuestions} câu
- Thời gian làm bài: ${config.timeLimitMinutes} phút
${config.focusTopics && config.focusTopics.length > 0 ? `- Các chủ đề trọng tâm: ${config.focusTopics.join(', ')}` : ''}
${config.targetProvince ? `- Định dạng / Tỉnh thành hướng tới: ${config.targetProvince}` : ''}
${config.customPrompt ? `- Yêu cầu đặc biệt bổ sung từ người dùng: "${config.customPrompt}"` : ''}

Hãy trả về DUY NHẤT mã JSON theo cấu trúc quy định.`;

  onProgressUpdate?.('Đang gửi yêu cầu đến Gemini AI và khởi tạo câu hỏi...');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(effectiveKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: systemInstruction },
            { text: userPrompt },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || response.statusText;
    throw new Error(`Lỗi từ Gemini API (${response.status}): ${errorMsg}`);
  }

  onProgressUpdate?.('Đang xử lý và chuẩn hóa dữ liệu đề thi...');

  const responseData = await response.json();
  const rawText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Không nhận được phản hồi nội dung từ AI. Vui lòng thử lại.');
  }

  // Parse JSON
  let parsedData: any;
  try {
    parsedData = JSON.parse(rawText);
  } catch (parseError) {
    // Thử làm sạch markdown nếu có bọc ```json ... ```
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    parsedData = JSON.parse(cleaned);
  }

  if (!parsedData || !Array.isArray(parsedData.questions) || parsedData.questions.length === 0) {
    throw new Error('Dữ liệu đề thi AI trả về không đúng định dạng. Vui lòng thử lại.');
  }

  onProgressUpdate?.('Hoàn tất! Đang định dạng câu hỏi và liên kết vào hệ thống...');

  const examTimestamp = Date.now();
  const examId = `exam_ai_${examTimestamp}`;

  // Chuẩn hóa danh sách câu hỏi
  const formattedQuestions: Question[] = parsedData.questions.map((q: any, idx: number) => {
    const qId = `q_ai_${examTimestamp}_${idx + 1}`;
    
    // Đảm bảo options là mảng 4 phần tử
    let opts = Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A. ', 'B. ', 'C. ', 'D. '];
    opts = opts.map((opt: string, i: number) => {
      const prefix = ['A. ', 'B. ', 'C. ', 'D. '][i];
      if (!opt.startsWith('A.') && !opt.startsWith('B.') && !opt.startsWith('C.') && !opt.startsWith('D.') &&
          !opt.startsWith('A. ') && !opt.startsWith('B. ') && !opt.startsWith('C. ') && !opt.startsWith('D. ')) {
        return `${prefix}${opt}`;
      }
      return opt;
    });

    const validCorrect = typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3
      ? q.correctOption
      : 0;

    return {
      id: qId,
      topicId: (q.topicId as TopicId) || 'grammar',
      subTopicId: (q.subTopicId as SubTopicId) || 'tenses',
      difficulty: (q.difficulty as DifficultyLevel) || 'medium',
      content: q.content || `Câu ${idx + 1}`,
      passage: q.passage || undefined,
      options: opts,
      correctOption: validCorrect,
      explanation: q.explanation || 'Xem đáp án và tự ôn tập quy tắc ngữ pháp.',
      grammarRule: q.grammarRule || undefined,
      commonMistakeTip: q.commonMistakeTip || undefined,
      translation: q.translation || undefined,
    };
  });

  const generatedExam: Exam = {
    id: examId,
    code: parsedData.code || `TS10-AI-${Math.floor(100 + Math.random() * 900)}`,
    title: parsedData.title || config.title || 'Đề Thi Thử Tiếng Anh Tuyển Sinh Lớp 10 (Tạo bởi AI)',
    description: parsedData.description || `Đề thi ${formattedQuestions.length} câu được thiết kế tự động bởi Gemini AI theo yêu cầu riêng.`,
    targetProvince: parsedData.targetProvince || config.targetProvince || 'Chuẩn Sở GD&ĐT',
    timeLimitMinutes: parsedData.timeLimitMinutes || config.timeLimitMinutes || 45,
    totalQuestions: formattedQuestions.length,
    difficulty: (parsedData.difficulty as any) || config.difficulty || 'standard',
    questionIds: formattedQuestions.map((q) => q.id),
    isOfficialFormat: false,
    createdAt: new Date().toISOString().split('T')[0],
  };

  return {
    exam: generatedExam,
    questions: formattedQuestions,
  };
}
