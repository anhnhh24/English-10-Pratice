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
 * Phục hồi và phân tích JSON đề thi ngay cả khi chuỗi JSON bị ngắt quãng hoặc thiếu đóng ngoặc do giới hạn token
 */
export function tryParseOrRepairExamJson(rawText: string): any {
  if (!rawText || !rawText.trim()) return null;

  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // 1. Thử parse trực tiếp
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Tiếp tục xử lý phục hồi
  }

  // 2. Thử đóng ngoặc tự động cho JSON bị cắt cụt
  try {
    let repaired = cleaned;
    // Nếu kết thúc giữa chừng một chuỗi, đóng dấu nháy kép
    const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      repaired += '"';
    }

    // Đếm số ngoặc nhọn và ngoặc vuông chưa đóng
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    for (let i = 0; i < openBraces - closeBraces; i++) {
      repaired += '}';
    }
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      repaired += ']';
    }

    const quickParsed = JSON.parse(repaired);
    if (quickParsed && Array.isArray(quickParsed.questions) && quickParsed.questions.length > 0) {
      return quickParsed;
    }
  } catch (e) {
    // Tiếp tục phương pháp trích xuất từng câu hỏi
  }

  // 3. Trích xuất từng câu hỏi hoàn chỉnh bằng thuật toán quét ngoặc (Balanced Brace Scan)
  try {
    const questionsMatch = cleaned.match(/"questions"\s*:\s*\[/);
    if (!questionsMatch) {
      throw new Error('Không tìm thấy mảng câu hỏi');
    }

    const titleMatch = cleaned.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    const codeMatch = cleaned.match(/"code"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    const descMatch = cleaned.match(/"description"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    const targetProvMatch = cleaned.match(/"targetProvince"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    const diffMatch = cleaned.match(/"difficulty"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    const timeMatch = cleaned.match(/"timeLimitMinutes"\s*:\s*(\d+)/);

    const questionsStartIndex = cleaned.indexOf('[', questionsMatch.index);
    const questionsSubstring = cleaned.slice(questionsStartIndex + 1);

    const questions: any[] = [];
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let startObjIndex = -1;

    for (let i = 0; i < questionsSubstring.length; i++) {
      const char = questionsSubstring[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') {
          if (depth === 0) startObjIndex = i;
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0 && startObjIndex !== -1) {
            const objStr = questionsSubstring.substring(startObjIndex, i + 1);
            try {
              const qObj = JSON.parse(objStr);
              if (qObj && (qObj.content || qObj.options)) {
                questions.push(qObj);
              }
            } catch (err) {
              // Bỏ qua nếu câu đó bị lỗi cú pháp riêng
            }
            startObjIndex = -1;
          }
        }
      }
    }

    if (questions.length > 0) {
      return {
        title: titleMatch ? titleMatch[1] : undefined,
        code: codeMatch ? codeMatch[1] : undefined,
        description: descMatch ? descMatch[1] : undefined,
        targetProvince: targetProvMatch ? targetProvMatch[1] : undefined,
        difficulty: diffMatch ? diffMatch[1] : undefined,
        timeLimitMinutes: timeMatch ? parseInt(timeMatch[1], 10) : undefined,
        questions,
      };
    }
  } catch (err) {
    // Không thể trích xuất
  }

  throw new Error('Dữ liệu AI trả về không thể phân tích cú pháp. Vui lòng thử lại.');
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
      "content": "Nội dung câu hỏi bằng tiếng Anh",
      "passage": "Đoạn văn đọc hiểu hoặc điền từ (nếu có, nếu không thì null)",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctOption": 0, // Số nguyên từ 0 đến 3 tương ứng với A, B, C, D
      "explanation": "Giải thích ngắn gọn 1-2 câu vì sao chọn đáp án này",
      "grammarRule": "Công thức hoặc quy tắc cốt lõi áp dụng",
      "commonMistakeTip": "Mẹo tránh bẫy ngắn gọn",
      "translation": "Dịch câu hỏi và đáp án sang tiếng Việt ngắn gọn"
    }
  ]
}

LƯU Ý CỰC KỲ QUAN TRỌNG:
1. Đảm bảo đúng chính xác ${config.totalQuestions} câu hỏi trong mảng 'questions'.
2. Các đáp án trong 'options' phải bắt đầu bằng 'A. ', 'B. ', 'C. ', 'D. '.
3. 'correctOption' phải là số index (0 cho A, 1 cho B, 2 cho C, 3 cho D).
4. Giữ phần giải thích 'explanation', 'grammarRule', 'translation' súc tích, ngắn gọn (1-2 câu) để đảm bảo toàn bộ đề thi được sinh trọn vẹn và nhanh chóng.`;

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

  // Cấu hình payload với token limit lớn và tắt thinking budget cho model 2.5 flash
  const requestBody: any = {
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
      maxOutputTokens: 32768,
    },
  };

  // Nếu là model gemini-2.5-flash hoặc 2.0, tắt/giảm thinking budget để tránh ngốn token output
  if (model.includes('2.5-flash') || model.includes('2.0-flash')) {
    requestBody.generationConfig.thinkingConfig = {
      thinkingBudget: 0,
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
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

  // Parse JSON với bộ phục hồi tự động thông minh
  const parsedData = tryParseOrRepairExamJson(rawText);

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


export interface ExamEvaluationReport {
  overallAssessment: string;
  gradePrediction: string;
  strengths: string[];
  weaknesses: {
    topicName: string;
    issue: string;
    solution: string;
  }[];
  actionPlan: string[];
  timeManagementComment: string;
  examTacticsTip: string;
}

/**
 * Đánh giá kết quả bài thi tức thì bằng thuật toán phân tích ma trận kiến thức
 */
export function getLocalExamEvaluation(
  score: number,
  totalQuestions: number,
  timeSpentSeconds: number,
  timeLimitMinutes: number,
  topicBreakdown: Record<string, { total: number; correct: number; wrong: number; name: string }>,
  targetScore: number = 8.5
): ExamEvaluationReport {
  const percentage = Math.round((score / 10) * 100);
  const timeSpentMinutes = Math.round(timeSpentSeconds / 60);

  // Điểm mạnh: những phần làm đúng >= 80%
  const strengths: string[] = [];
  // Điểm yếu: những phần làm sai > 30%
  const weaknesses: { topicName: string; issue: string; solution: string }[] = [];

  Object.values(topicBreakdown).forEach((tb) => {
    if (tb.total > 0) {
      const acc = (tb.correct / tb.total) * 100;
      if (acc >= 75) {
        strengths.push(`${tb.name} (Đúng ${tb.correct}/${tb.total} câu - ${Math.round(acc)}%)`);
      } else {
        weaknesses.push({
          topicName: tb.name,
          issue: `Tỷ lệ làm đúng chỉ đạt ${Math.round(acc)}% (${tb.wrong} câu sai trong phần này).`,
          solution: `Xem lại lý thuyết trọng tâm về ${tb.name} và luyện tập thêm 15-20 câu chuyên đề tương tự.`,
        });
      }
    }
  });

  if (strengths.length === 0) {
    strengths.push('Tinh thần nỗ lực hoàn thành trọn vẹn bài thi đúng thời gian quy định.');
  }

  let overall = '';
  let gradePrediction = '';
  if (score >= 9.0) {
    overall = `Xuất sắc! Bạn đã đạt ${score} điểm, hoàn toàn làm chủ kiến thức và đạt phong độ sẵn sàng thi vào các trường THPT Chuyên hoặc Top 1.`;
    gradePrediction = `Dự đoán điểm thi vào 10 thực tế: 9.0 - 9.75 (Tỷ lệ đỗ NV1: >95%)`;
  } else if (score >= 8.0) {
    overall = `Rất tốt! Điểm số ${score} cho thấy nền tảng ngữ pháp và từ vựng của bạn rất vững vàng, đang tiệm cận mức điểm thi vào các trường THPT chất lượng cao.`;
    gradePrediction = `Dự đoán điểm thi vào 10 thực tế: 8.0 - 8.75 (Tỷ lệ đỗ NV1: ~88%)`;
  } else if (score >= 6.5) {
    overall = `Khá ổn! Bạn đạt ${score} điểm. Bạn đã nắm chắc các câu cơ bản nhưng còn vấp phải một số bẫy câu phân loại và mệnh đề nâng cao.`;
    gradePrediction = `Dự đoán điểm thi vào 10 thực tế: 6.5 - 7.5 (Cần bứt phá thêm để chắc suất NV1)`;
  } else {
    overall = `Bạn đạt ${score} điểm. Cần tập trung ôn luyện lại các mảng ngữ pháp nền tảng (các thì cơ bản, câu điều kiện, phát âm) trước khi giải thêm đề tổng hợp.`;
    gradePrediction = `Dự đoán điểm thi vào 10 thực tế: 5.5 - 6.5 (Cần kế hoạch ôn luyện tập trung)`;
  }

  let timeComment = '';
  if (timeSpentMinutes <= timeLimitMinutes * 0.6) {
    timeComment = `Bạn làm bài rất nhanh (${timeSpentMinutes}/${timeLimitMinutes} phút). Hãy chú ý đọc kỹ từng câu và rà soát lại các câu bẫy trước khi nộp để tránh mất điểm đáng tiếc.`;
  } else if (timeSpentMinutes >= timeLimitMinutes * 0.95) {
    timeComment = `Bạn dùng gần hết thời gian (${timeSpentMinutes}/${timeLimitMinutes} phút). Nên rèn thêm phản xạ làm nhanh các câu ngữ âm và ngữ pháp đơn giản để dành nhiều thời gian cho phần Đọc hiểu.`;
  } else {
    timeComment = `Tốc độ phân bổ thời gian hợp lý (${timeSpentMinutes}/${timeLimitMinutes} phút).`;
  }

  const actionPlan = [
    'Mở Sổ câu sai để đọc kỹ phần giải thích chi tiết và ghi nhớ công thức của các câu vừa làm sai.',
    weaknesses.length > 0
      ? `Tập trung luyện chuyên đề "${weaknesses[0].topicName}" để vá lỗ hổng kiến thức ngay trong tuần này.`
      : 'Tiếp tục luyện thêm 1 đề thi thử mới để duy trì cảm giác phòng thi.',
    'Áp dụng quy tắc "loại trừ đáp án sai rõ ràng" trước khi chọn đáp án cuối cùng đối với câu phân vân.',
  ];

  return {
    overallAssessment: overall,
    gradePrediction,
    strengths,
    weaknesses,
    actionPlan,
    timeManagementComment: timeComment,
    examTacticsTip: 'Chiến thuật phòng thi: Làm phần Ngữ âm & Trọng âm trước (5 phút) -> Câu ngắn từ vựng/ngữ pháp (15 phút) -> Bài đọc & Viết lại câu (25 phút) -> 10 phút cuối soát lại toàn bộ phiếu trả lời.',
  };
}

/**
 * Đánh giá chuyên sâu và cá nhân hóa bằng Gemini AI
 */
export async function generateExamEvaluationWithAI(
  apiKey: string,
  examTitle: string,
  score: number,
  totalQuestions: number,
  timeSpentSeconds: number,
  topicBreakdown: Record<string, { total: number; correct: number; wrong: number; name: string }>,
  wrongQuestionsList: { content: string; userChoice: string; correctChoice: string; topic: string; explanation: string }[],
  targetScore: number = 8.5,
  modelName: string = 'gemini-2.5-flash'
): Promise<ExamEvaluationReport> {
  const effectiveKey = apiKey.trim() || getStoredApiKey();
  if (!effectiveKey) {
    throw new Error('Chưa cung cấp Gemini API Key.');
  }

  const prompt = `Bạn là một chuyên gia khảo thí và cố vấn học tập luyện thi Tiếng Anh vào lớp 10 THPT.
Hãy phân tích kết quả bài làm sau của một học sinh và đưa ra báo cáo đánh giá năng lực chi tiết, chỉ ra chính xác các lỗ hổng kiến thức và lộ trình khắc phục điểm yếu.

THÔNG TIN BÀI THI:
- Đề thi: ${examTitle}
- Điểm số đạt được: ${score}/10 (Số câu đúng: ${totalQuestions - wrongQuestionsList.length}/${totalQuestions})
- Thời gian làm bài: ${Math.round(timeSpentSeconds / 60)} phút
- Mục tiêu điểm của học sinh: ${targetScore}/10

THỐNG KÊ KẾT QUẢ THEO TỪNG CHUYÊN ĐỀ:
${Object.entries(topicBreakdown)
  .map(([_, v]) => `- ${v.name}: Đúng ${v.correct}/${v.total} câu (${Math.round((v.correct / (v.total || 1)) * 100)}%)`)
  .join('\n')}

DANH SÁCH CÁC CÂU LÀM SAI VÀ LÝ DO:
${wrongQuestionsList
  .slice(0, 10)
  .map(
    (q, i) =>
      `${i + 1}. [Chủ đề: ${q.topic}] Câu: "${q.content}" | Học sinh chọn sai: "${q.userChoice}" | Đáp án đúng: "${q.correctChoice}" | Lời giải: "${q.explanation}"`
  )
  .join('\n')}

YÊU CẦU ĐẦU RA (JSON FORMAT):
Bạn PHẢI trả về DUY NHẤT một chuỗi JSON hợp lệ không bọc thêm văn bản giải thích:
{
  "overallAssessment": "Nhận xét tổng quan toàn diện về năng lực, mức độ nắm vững kiến thức so với mục tiêu ${targetScore}đ",
  "gradePrediction": "Dự đoán dải điểm thi vào lớp 10 thực tế và khả năng đỗ NV1",
  "strengths": [
    "Điểm mạnh 1 (các dạng câu hoặc kỹ năng học sinh xử lý tốt)",
    "Điểm mạnh 2"
  ],
  "weaknesses": [
    {
      "topicName": "Tên phần kiến thức bị hổng (ví dụ: Mệnh đề quan hệ / Câu điều kiện loại 3)",
      "issue": "Mô tả cụ thể lỗi sai hay mắc phải và bẫy bị lừa",
      "solution": "Cách khắc phục và mẹo ghi nhớ ngắn gọn"
    }
  ],
  "actionPlan": [
    "Bước 1 trong lộ trình cải thiện điểm số tuần này",
    "Bước 2",
    "Bước 3"
  ],
  "timeManagementComment": "Nhận xét về tốc độ làm bài và phân bổ thời gian",
  "examTacticsTip": "Mẹo chiến thuật làm bài thi thực tế để không bị mất điểm oan"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(effectiveKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || response.statusText;
    throw new Error(`Lỗi từ Gemini API (${response.status}): ${errorMsg}`);
  }

  const responseData = await response.json();
  const rawText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Không nhận được phản hồi đánh giá từ AI.');
  }

  let parsed: ExamEvaluationReport;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    parsed = JSON.parse(cleaned);
  }

  return parsed;
}

