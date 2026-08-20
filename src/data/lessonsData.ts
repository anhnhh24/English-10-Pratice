import { Lesson } from '../types';

export const LESSONS_DATA: Lesson[] = [
  {
    id: 'lesson_tenses',
    topicId: 'grammar',
    subTopicId: 'tenses',
    title: 'Các thì trọng tâm trong đề thi vào 10',
    subTitle: 'Hiện tại đơn, Quá khứ đơn, Hiện tại hoàn thành, Tương lai đơn, Quá khứ tiếp diễn',
    summary: 'Nắm vững công thức, dấu hiệu nhận biết và các trường hợp kết hợp thì thường xuất hiện trong đề thi tuyển sinh.',
    formulas: [
      {
        name: 'Hiện tại hoàn thành (Present Perfect)',
        formula: 'S + have/has + V3/ed + O',
        example: 'She has lived here for 5 years. / Have you ever been to Da Nang?',
        note: 'Dấu hiệu: since + mốc tg, for + khoảng tg, already, yet, just, ever, never, so far.',
      },
      {
        name: 'Quá khứ đơn (Past Simple)',
        formula: 'S + V2/ed + O (Phủ định: S + didn\'t + V-inf)',
        example: 'We visited Ha Long Bay last summer. / They didn\'t watch TV yesterday.',
        note: 'Dấu hiệu: yesterday, last night/week, ago, in 2020, when S + V2/ed.',
      },
      {
        name: 'Kết hợp Quá khứ đơn & Quá khứ tiếp diễn (When / While)',
        formula: 'When + S + V2/ed (xen vào), S + was/were + V-ing (đang diễn ra)',
        example: 'When the phone rang, I was having dinner. / While I was reading, he was sleeping.',
        note: 'Hành động đang xảy ra dùng QKTD, hành động ngắn cắt ngang dùng QKĐ.',
      },
    ],
    rules: [
      {
        title: 'Quy tắc chia thì theo mệnh đề thời gian (Time Clauses)',
        detail: 'Trong mệnh đề trạng ngữ chỉ thời gian với when, as soon as, until, before, after kết hợp với tương lai, TUYỆT ĐỐI KHÔNG dùng will mà dùng Hiện tại đơn hoặc Hiện tại hoàn thành.',
        examples: [
          'I will call you as soon as I arrive home. (KHÔNG dùng: will arrive)',
          'We will leave when she finishes her homework.',
        ],
      },
      {
        title: 'Cấu trúc chuyển đổi Hiện tại hoàn thành sang Quá khứ đơn',
        detail: 'Cực kỳ hay gặp trong bài viết lại câu trắc nghiệm!',
        examples: [
          'S + have/has not + V3/ed + for [time] <=> The last time S + V2/ed + was [time] ago.',
          'This is the first time S + have/has + V3/ed <=> S + have/has never + V3/ed + before.',
        ],
      },
    ],
    examTips: [
      'Nhìn ngay vào trạng từ thời gian cuối câu (ago, since, next week, now) để khoanh vùng thì.',
      'Chú ý chủ ngữ số ít (he, she, it, danh từ không đếm được) để chia has / was / Vs-es chính xác.',
    ],
    keySignals: ['since', 'for', 'already', 'yet', 'yesterday', 'ago', 'last', 'while', 'as soon as'],
  },
  {
    id: 'lesson_passive',
    topicId: 'grammar',
    subTopicId: 'passive_voice',
    title: 'Câu bị động (Passive Voice)',
    subTitle: 'Quy tắc chuyển đổi từ chủ động sang bị động và các dạng đặc biệt',
    summary: 'Câu bị động dùng để nhấn mạnh đối tượng chịu tác động của hành động. Công thức chung: BE + V3/ed.',
    formulas: [
      {
        name: 'Công thức chung',
        formula: 'Chủ động: S + V + O  ==> Bị động: S(O) + BE (chia theo thì) + V3/ed + (by O(S))',
        example: 'Active: Nam repaired the bike. ==> Passive: The bike was repaired by Nam.',
      },
      {
        name: 'Bị động với Modal Verbs (can, must, should, will...)',
        formula: 'S + modal verb + BE + V3/ed',
        example: 'You must submit the test. ==> The test must be submitted.',
      },
      {
        name: 'Bị động với động từ chỉ ý kiến (It is said that...)',
        formula: 'It + is/was + said/believed/thought + that + S + V...',
        example: 'People say he is rich. ==> It is said that he is rich. / He is said to be rich.',
      },
    ],
    rules: [
      {
        title: 'Vị trí của trạng từ chỉ nơi chốn, thời gian và "by O"',
        detail: 'Nơi chốn + by O + Thời gian (Nơi - By - Thời)',
        examples: [
          'The picture was painted in the garden (nơi chốn) by Lan (by O) yesterday (thời gian).',
        ],
      },
      {
        title: 'Bỏ "by O" khi nào?',
        detail: 'Bỏ by + someone, people, them, him, her, us, me, everyone khi chủ thể không xác định hoặc không quan trọng.',
        examples: ['Someone stole my pen. ==> My pen was stolen.'],
      },
    ],
    examTips: [
      'Nếu chủ ngữ là vật, 90% động từ đi kèm phải ở dạng bị động (Be + V3/ed).',
      'Đề thi hay gài bẫy thì hoàn thành: Has/Have + BEEN + V3/ed (thường học sinh quên chữ BEEN).',
    ],
    keySignals: ['by + tác nhân', 'chủ ngữ là đồ vật/sự việc', 'need + V-ing (= need to be done)'],
  },
  {
    id: 'lesson_conditionals',
    topicId: 'grammar',
    subTopicId: 'conditionals',
    title: 'Câu điều kiện (Conditionals) & Unless / Wish',
    subTitle: 'Điều kiện loại 1, loại 2, cấu trúc Unless và câu ước Wish',
    summary: 'Chuyên đề xuất hiện 100% trong mọi đề thi vào lớp 10 cả phần trắc nghiệm và viết lại câu.',
    formulas: [
      {
        name: 'Điều kiện Loại 1 (Có thật ở hiện tại/tương lai)',
        formula: 'If + S + V(hiện tại đơn), S + will / can / must + V-inf',
        example: 'If it rains tomorrow, we will stay at home.',
        note: 'Unless = If... not (Trừ khi). Ví dụ: Unless you study, you will fail.',
      },
      {
        name: 'Điều kiện Loại 2 (Không có thật ở hiện tại)',
        formula: 'If + S + V2/ed (were cho mọi ngôi), S + would / could + V-inf',
        example: 'If I were you, I would accept that offer. / If I had money, I could buy it.',
        note: 'Với động từ TO BE ở mệnh đề If, luôn ưu tiên dùng WERE cho tất cả các ngôi.',
      },
      {
        name: 'Câu ước ở hiện tại (Wish / If only)',
        formula: 'S + wish(es) + (that) + S + V2/ed (were cho mọi ngôi)',
        example: 'I wish I had a new laptop. / She wishes she were taller.',
        note: 'Ước cho tương lai: S + wish + S + WOULD / COULD + V-inf.',
      },
    ],
    rules: [
      {
        title: 'Quy tắc chuyển đổi câu với Unless',
        detail: 'Unless = If + not. Chú ý không dùng 2 lần phủ định trong cùng mệnh đề Unless.',
        examples: [
          'If you don\'t hurry, you will be late. ==> Unless you hurry, you will be late.',
          'If she doesn\'t study, she won\'t pass. ==> Unless she studies, she won\'t pass.',
        ],
      },
      {
        title: 'Chuyển đổi câu thực tế sang câu điều kiện loại 2',
        detail: 'Đổi câu khẳng định ở hiện tại sang phủ định ở loại 2 và ngược lại.',
        examples: [
          'I am poor, so I can\'t travel abroad. ==> If I were not poor / If I were rich, I could travel abroad.',
        ],
      },
    ],
    examTips: [
      'Gặp "Because / So" ở hiện tại => viết lại bằng câu điều kiện loại 2 (lùi thì và đảo ngược nghĩa khẳng định/phủ định).',
      'Đề thi hay bẫy câu Wish: không bao giờ dùng thì hiện tại trong mệnh đề sau Wish.',
    ],
    keySignals: ['If', 'Unless', 'Wish', 'If only', 'Or / Otherwise', 'As long as'],
  },
  {
    id: 'lesson_relative_clauses',
    topicId: 'grammar',
    subTopicId: 'relative_clauses',
    title: 'Mệnh đề quan hệ (Relative Clauses)',
    subTitle: 'Who, Whom, Which, That, Whose, Where, When, Why',
    summary: 'Cách dùng các đại từ quan hệ để nối hai câu đơn thành một câu phức.',
    formulas: [
      {
        name: 'Đại từ chỉ Người',
        formula: 'WHO (làm S hoặc O) / WHOM (chỉ làm O) / WHOSE (sở hữu + Noun)',
        example: 'The girl who won the prize is my sister. / The man whom we met is a doctor.',
      },
      {
        name: 'Đại từ chỉ Vật',
        formula: 'WHICH (làm S hoặc O) / THAT (thay cho cả người & vật)',
        example: 'The book which is on the table is mine. / The car that he bought is expensive.',
      },
      {
        name: 'Trạng từ quan hệ',
        formula: 'WHERE (= in/at which) / WHEN (= on/in which) / WHY (= for which)',
        example: 'This is the town where I was born. / I remember the day when we first met.',
      },
    ],
    rules: [
      {
        title: 'Trường hợp KHÔNG ĐƯỢC dùng THAT',
        detail: '1. Trong mệnh đề quan hệ không xác định (có dấu phẩy ","). 2. Đi sau giới từ (in that -> SAI, phải dùng in which).',
        examples: [
          'Mr. Nam, who is my teacher, is very kind. (KHÔNG dùng: Mr. Nam, that...)',
          'The house in which I live. (KHÔNG dùng: in that)',
        ],
      },
      {
        title: 'Trường hợp BẮT BUỘC dùng THAT',
        detail: 'Sau các từ chỉ cả người và vật, sau tính từ so sánh nhất (the most, the best), sau all, every, nothing, everything, only.',
        examples: ['He talked about the people and places that he had visited.'],
      },
    ],
    examTips: [
      'Nếu thấy dấu phẩy trước chỗ trống => GẠCH NGAY đáp án THAT.',
      'Nếu thấy giới từ (in, at, with, about...) trước chỗ trống => CHỈ CHỌN WHOM (người) hoặc WHICH (vật).',
    ],
    keySignals: ['who', 'whom', 'which', 'that', 'whose + N', 'where', 'when'],
  },
  {
    id: 'lesson_reported_speech',
    topicId: 'grammar',
    subTopicId: 'reported_speech',
    title: 'Câu gián tiếp (Reported Speech)',
    subTitle: 'Quy tắc lùi thì, đổi đại từ, đổi trạng từ chỉ thời gian và nơi chốn',
    summary: 'Chuyển đổi lời nói trực tiếp sang gián tiếp cho câu trần thuật, câu hỏi và câu mệnh lệnh.',
    formulas: [
      {
        name: 'Câu trần thuật (Statements)',
        formula: 'S + said (that) / told + O + S\' + V (lùi 1 thì)...',
        example: '"I am tired", Tom said. ==> Tom said that he was tired.',
      },
      {
        name: 'Câu hỏi Yes/No (Yes/No Questions)',
        formula: 'S + asked + O + IF / WHETHER + S\' + V (lùi thì, trật tự câu khẳng định)',
        example: '"Do you like tea?", she asked me. ==> She asked me if I liked tea.',
        note: 'KHÔNG đảo trợ động từ lên trước S trong câu gián tiếp!',
      },
      {
        name: 'Câu hỏi Wh- (Wh- Questions)',
        formula: 'S + asked + O + WH-word + S\' + V (lùi thì)',
        example: '"Where do you live?", he asked. ==> He asked me where I lived.',
      },
      {
        name: 'Câu mệnh lệnh / yêu cầu / khuyên nhủ',
        formula: 'S + told/asked/advised/warned + O + (NOT) TO V-inf',
        example: '"Please open the window", she said. ==> She asked me to open the window.',
      },
    ],
    rules: [
      {
        title: 'Quy tắc đổi trạng từ chỉ thời gian & nơi chốn',
        detail: 'Now -> then, today -> that day, tomorrow -> the next day / the following day, yesterday -> the day before / the previous day, here -> there, this -> that, these -> those, ago -> before.',
        examples: ['"I will meet you tomorrow" ==> He said he would meet me the next day.'],
      },
    ],
    examTips: [
      'Bẫy cực kỳ phổ biến: Đề thi giữ nguyên trật tự câu hỏi đảo ngữ "asked me where did I live" => SAI, phải là "where I lived".',
      'Động từ suggest: S + suggested + V-ing / suggested that S (should) + V-inf.',
    ],
    keySignals: ['said that', 'told me that', 'asked if/whether', 'advised to V', 'suggested V-ing'],
  },
  {
    id: 'lesson_pronunciation_rules',
    topicId: 'pronunciation',
    subTopicId: 'pronunciation_s_es',
    title: 'Bí kíp phát âm đuôi -s/es và -ed',
    subTitle: 'Tuyệt chiêu ghi nhớ 100% ăn điểm phần ngữ âm',
    summary: 'Chỉ cần nhớ các câu thần chú vui nhộn là giải quyết trọn vẹn 2 câu phát âm trong đề thi.',
    formulas: [
      {
        name: 'Quy tắc phát âm đuôi -s / -es',
        formula: '1. /s/: Tận cùng là âm vô thanh /p, k, f, t, θ/ (Câu thần chú: "Thời Phong Kiến Phương Tây")\n2. /ɪz/: Tận cùng là /s, z, ʃ, ʒ, tʃ, dʒ/ (ch, sh, s, x, z, ge, ce)\n3. /z/: Các trường hợp còn lại (nguyên âm và các phụ âm hữu thanh).',
        example: 'stops /s/, books /s/, laughs /s/, watches /ɪz/, boxes /ɪz/, plays /z/, dogs /z/.',
      },
      {
        name: 'Quy tắc phát âm đuôi -ed',
        formula: '1. /ɪd/: Tận cùng là âm /t/ hoặc /d/ (Câu thần chú: "Tiền Đô")\n2. /t/: Tận cùng là âm vô thanh /p, k, f, s, ʃ, tʃ/ (Câu thần chú: "Chính Phủ Phát Sách Không Thu Phí")\n3. /d/: Các trường hợp còn lại.',
        example: 'wanted /ɪd/, needed /ɪd/, stopped /t/, looked /t/, washed /t/, played /d/, cleaned /d/.',
        note: 'Ngoại lệ đuôi -ed phát âm /ɪd/: naked, wicked, sacred, beloved, learned (adj), aged (adj).',
      },
    ],
    rules: [
      {
        title: 'Phát âm đuôi -ed của các tính từ đặc biệt',
        detail: 'Một số tính từ tận cùng là -ed luôn đọc là /ɪd/ dù trước đó không phải là t hoặc d.',
        examples: ['naked /ˈneɪkɪd/, wicked /ˈwɪkɪd/, beloved /bɪˈlʌvɪd/, blessed /ˈblesɪd/.'],
      },
    ],
    examTips: [
      'Chữ "gh" hoặc "ph" phát âm là /f/ (ví dụ: laughs, coughs, photographs) => đuôi -s đọc là /s/, đuôi -ed đọc là /t/.',
    ],
    keySignals: ['đuôi -s/es', 'đuôi -ed', 'ch, sh, ss, x, ce, ge', 'p, k, f, t, th'],
  },
  {
    id: 'lesson_stress_rules',
    topicId: 'stress',
    subTopicId: 'stress_2_syllables',
    title: 'Quy tắc đánh trọng âm từ 2 & 3 âm tiết',
    subTitle: 'Nắm chắc vị trí trọng âm danh từ, động từ, tính từ và các hậu tố',
    summary: 'Phương pháp nhận diện trọng âm giúp tối ưu điểm số phần trắc nghiệm phát âm - trọng âm.',
    formulas: [
      {
        name: 'Trọng âm từ 2 âm tiết',
        formula: '1. Danh từ & Tính từ 2 âm tiết: Trọng âm thường rơi vào ÂM TIẾT 1.\n2. Động từ 2 âm tiết: Trọng âm thường rơi vào ÂM TIẾT 2.',
        example: 'Noun/Adj: \'teacher, \'student, \'happy, \'famous. Verb: de\'cide, pro\'tect, a\'rrive, re\'ceive.',
        note: 'Ngoại lệ: ma\'chine (N), mis\'take (N), \'borrow (V), \'happen (V), \'visit (V), \'listen (V).',
      },
      {
        name: 'Quy tắc hậu tố 3 âm tiết',
        formula: '1. Hậu tố nhận chính trọng âm: -ee, -eer, -ese, -ique (employ\'ee, Chi\'nese, engin\'eer).\n2. Hậu tố làm trọng âm rơi vào âm trước nó: -tion, -sion, -ic, -ical, -ity, -logy (pol\'lution, de\'cision, mu\'sician, e\'lectric, a\'bility).',
        example: 'infor\'mation, com\'puter, his\'torical, con\'venient.',
      },
    ],
    rules: [
      {
        title: 'Tiền tố và hậu tố không làm thay đổi trọng âm gốc',
        detail: 'Các tiền tố un-, im-, in-, dis-, re-, non- và hậu tố -ful, -less, -ly, -ment, -ness, -er, -or không mang trọng âm.',
        examples: [
          'happy -> un\'happy',
          'agree -> a\'greement',
          'care -> \'careful -> \'carefully',
        ],
      },
    ],
    examTips: [
      'Âm /ə/ (ơ ngắn) và /i/ ngắn KHÔNG BAO GIỜ nhận trọng âm (ví dụ: a\'bout, con\'tain, a\'lone).',
    ],
    keySignals: ['-tion, -sion, -ic, -ity', '-ee, -ese, -eer', 'Danh từ 2 âm tiết (1)', 'Động từ 2 âm tiết (2)'],
  },
  {
    id: 'lesson_sentence_transformation',
    topicId: 'sentence_rewrite',
    subTopicId: 'rewrite_connectors',
    title: 'Tuyệt chiêu Viết lại câu (Sentence Transformation)',
    subTitle: 'Các mẫu câu chuyển đổi kinh điển trong đề thi vào 10',
    summary: 'Tổng hợp các cặp cấu trúc biến đổi qua lại kèm mẹo làm bài nhanh và chính xác.',
    formulas: [
      {
        name: 'Although / Even though / Though <==> In spite of / Despite',
        formula: 'Although + S + V + O <==> In spite of / Despite + V-ing / Noun phrase / the fact that + S + V',
        example: 'Although it rained heavily, we went out. ==> Despite the heavy rain, we went out.',
      },
      {
        name: 'Because / Since / As <==> Because of / Due to',
        formula: 'Because + S + V + O <==> Because of + V-ing / Noun phrase / the fact that + S + V',
        example: 'Because she was sick, she stayed home. ==> Because of her sickness, she stayed home.',
      },
      {
        name: 'So... that / Such... that <==> Too / Enough',
        formula: 'S + be/V + so + adj/adv + that + S + V\n<==> S + be/V + such + (a/an) + adj + N + that + S + V\n<==> S + be + too + adj + (for O) + to V\n<==> S + be + adj + enough + (for O) + to V',
        example: 'The coffee is so hot that I can\'t drink it. ==> The coffee is too hot for me to drink.',
      },
      {
        name: 'Used to <==> Be/Get used to',
        formula: 'S + used to + V-inf (Thói quen trong quá khứ đã chấm dứt)\nS + be/get used to + V-ing (Đang quen dần với việc gì ở hiện tại)',
        example: 'He lived in the village when young. ==> He used to live in the village when he was young.',
      },
    ],
    rules: [
      {
        title: 'Mẹo biến đổi Mệnh đề (S + V) thành Cụm danh từ (Noun Phrase)',
        detail: '1. S + be + adj ==> tính từ sở hữu + adj + N (He was lazy ==> his laziness). 2. Cùng chủ ngữ: dùng V-ing (Because he worked hard ==> Because of working hard).',
        examples: [
          'Although he is young, he is talented. ==> In spite of his youth / being young, he is talented.',
        ],
      },
    ],
    examTips: [
      'Với cấu trúc ENOUGH: tính từ đứng TRƯỚC enough (rich enough), còn danh từ đứng SAU enough (enough money). Nhớ mẹo: "Tính Trước - Danh Sau".',
      'Với TOO... TO: mang nghĩa tiêu cực (quá... đến nỗi không thể làm gì), khi chuyển sang SO... THAT phải có phủ định (can\'t / couldn\'t).',
    ],
    keySignals: ['Although <-> Despite', 'Because <-> Because of', 'So... that <-> Such... that', 'Too... to <-> Enough... to'],
  },
];
