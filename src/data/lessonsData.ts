import { Lesson } from '../types';

export const LESSONS_DATA: Lesson[] = [
  // ─── 1. CÁC THÌ TRỌNG TÂM ───
  {
    id: 'lesson_tenses',
    topicId: 'grammar',
    subTopicId: 'tenses',
    title: '1. Các Thì Trọng Tâm & Mệnh Đề Thời Gian',
    subTitle: 'Hiện tại đơn, Quá khứ đơn, Hiện tại hoàn thành, Quá khứ tiếp diễn, Tương lai đơn',
    summary: 'Nắm vững 5 thì xuất hiện 100% trong đề thi tuyển sinh vào 10, quy tắc phối hợp thì và mệnh đề trạng ngữ chỉ thời gian.',
    formulas: [
      {
        name: 'Hiện tại hoàn thành (Present Perfect)',
        formula: 'S + have/has + V3/ed + O\n(-) S + haven\'t / hasn\'t + V3/ed\n(?) Have/Has + S + V3/ed?',
        example: 'She has lived here for 5 years. / I haven\'t seen him since Monday.',
        note: 'Dấu hiệu vàng: since + mốc thời gian, for + khoảng thời gian, already, yet, just, ever, never, so far, recently, up to now, several times.',
      },
      {
        name: 'Quá khứ đơn (Past Simple)',
        formula: 'S + V2/ed + O (Phủ định: S + didn\'t + V-inf; Nghi vấn: Did + S + V-inf?)',
        example: 'We visited Ha Long Bay last summer. / They didn\'t go to school yesterday.',
        note: 'Dấu hiệu: yesterday, last night/week/year, ago, in + năm quá khứ (in 2020), when S + V2/ed.',
      },
      {
        name: 'Phối hợp thì Quá khứ đơn & Quá khứ tiếp diễn (When / While)',
        formula: '• When + S + V2/ed (hành động ngắn cắt ngang), S + was/were + V-ing (hành động dài đang xảy ra)\n• While + S + was/were + V-ing, S + was/were + V-ing (2 hành động song song)',
        example: 'When the phone rang, I was having dinner. / While my mother was cooking, I was reading books.',
        note: 'Hành động đang diễn ra dùng QKTD (was/were + V-ing), hành động chen ngang dùng QKĐ (V2/ed).',
      },
      {
        name: 'Mệnh đề trạng ngữ chỉ thời gian (Time Clauses)',
        formula: 'Mệnh đề chính (Tương lai đơn: S + will + V-inf) + When / As soon as / Until / Before / After + S + V(Hiện tại đơn / Hiện tại hoàn thành)',
        example: 'I will call you as soon as I arrive in Hanoi. (TUYỆT ĐỐI KHÔNG DÙNG: will arrive).',
        note: 'Quy tắc bất di bất dịch: KHÔNG BAO GIỜ dùng "WILL" trong mệnh đề trạng ngữ chỉ thời gian!',
      },
    ],
    rules: [
      {
        title: 'Cặp cấu trúc chuyển đổi Hiện tại hoàn thành <==> Quá khứ đơn (Hay thi viết lại câu nhất)',
        detail: 'Học thuộc lòng 3 mẫu chuyển đổi kinh điển:',
        examples: [
          '1) S + have/has not + V3/ed + for [time] <=> The last time S + V2/ed + was [time] ago <=> S + last + V2/ed + [time] ago.',
          '   Ví dụ: I haven\'t seen her for 2 years. <=> The last time I saw her was 2 years ago.',
          '2) S + started / began + V-ing / to V + [time] ago (hoặc in + năm) <=> S + have/has + V3/ed + for [time] (hoặc since + năm).',
          '   Ví dụ: He started learning English 5 years ago. <=> He has learned English for 5 years.',
          '3) This is the first time + S + have/has + V3/ed <=> S + have/has never + V3/ed + before.',
        ],
      },
    ],
    examTips: [
      '⚡ Mẹo nhìn nhanh: Nhìn ngay vào trạng từ thời gian cuối câu (ago, since, next week, now) để khoanh vùng thì trong 3 giây.',
      '⚠️ Cảnh báo bẫy: Cẩn thận chủ ngữ số ít (he, she, it, danh từ không đếm được) để chia has / was / Vs-es chính xác.',
    ],
    keySignals: ['since', 'for', 'already', 'yet', 'yesterday', 'ago', 'last', 'while', 'as soon as', 'the first time'],
  },

  // ─── 2. CÂU BỊ ĐỘNG ───
  {
    id: 'lesson_passive',
    topicId: 'grammar',
    subTopicId: 'passive_voice',
    title: '2. Câu Bị Động (Passive Voice) & Các Dạng Nâng Cao',
    subTitle: 'Quy tắc chuyển đổi từ chủ động sang bị động, Modal Verbs, Bị động kép & Thể nhờ bảo',
    summary: 'Câu bị động dùng để nhấn mạnh đối tượng chịu tác động của hành động. Công thức cốt lõi: BE + V3/ed.',
    formulas: [
      {
        name: 'Công thức chung cho tất cả các thì',
        formula: 'Chủ động: S + V + O  ==> Bị động: S(từ O) + BE (chia theo thì của câu gốc) + V3/ed + (by O(từ S))',
        example: 'Active: People speak English all over the world. ==> Passive: English is spoken all over the world.',
        note: 'Bảng thì của BE: Hiện tại đơn (is/am/are), Quá khứ đơn (was/were), HTTD (is/are + being), QKTD (was/were + being), HTHanThanh (have/has + been), Tương lai (will be).',
      },
      {
        name: 'Bị động với Modal Verbs (can, could, must, should, will, may, have to)',
        formula: 'S + modal verb + BE + V3/ed + (by O)',
        example: 'You must clean this room. ==> This room must be cleaned.',
      },
      {
        name: 'Bị động kép với động từ chỉ ý kiến (People say/think/believe/report that...)',
        formula: 'Cách 1: It + is/was + V3/ed (said/believed/thought) + that + S2 + V2...\nCách 2: S2 + is/was + said/believed/thought + TO V-inf (cùng thì) / TO HAVE V3/ed (lệch thì quá khứ)',
        example: 'People say that he is rich. ==> It is said that he is rich. / He is said to be rich.\nPeople think he broke the vase. ==> He is thought to have broken the vase.',
      },
      {
        name: 'Thể nhờ bảo / Sai khiến (Causative Form)',
        formula: '• HAVE: S + have + O(người) + V-inf = S + have + O(vật) + V3/ed\n• GET: S + get + O(người) + TO V-inf = S + get + O(vật) + V3/ed',
        example: 'I had the mechanic repair my car. ==> I had my car repaired by the mechanic.\nShe got him to wash her bike. ==> She got her bike washed.',
      },
    ],
    rules: [
      {
        title: 'Quy tắc vị trí: Nơi chốn - By O - Thời gian (Câu thần chú: "Nơi - By - Thời")',
        detail: 'Trạng từ nơi chốn đứng TRƯỚC "by O", trạng từ thời gian đứng SAU "by O".',
        examples: [
          'The bike was repaired in the garage (nơi chốn) by Tom (by O) yesterday (thời gian).',
        ],
      },
      {
        title: 'Bỏ "by O" khi nào?',
        detail: 'Bỏ by + someone, somebody, people, them, him, her, us, me, everyone khi chủ thể không xác định hoặc không quan trọng.',
        examples: ['Someone stole my bicycle. ==> My bicycle was stolen.'],
      },
    ],
    examTips: [
      '⚡ Nhận diện nhanh: Nếu chủ ngữ là ĐỒ VẬT / SỰ VIỆC, 90% động từ đi kèm phải ở dạng bị động (BE + V3/ed).',
      '⚠️ Bẫy đề thi hay gặp: Đề bài cho thì Hiện tại hoàn thành, học sinh rất hay quên chữ "BEEN" (phải là has/have BEEN + V3/ed).',
      '⚠️ Động từ NEED: Vật + need + V-ing = Vật + need + TO BE V3/ed (The car needs washing = needs to be washed).',
    ],
    keySignals: ['by + tác nhân', 'chủ ngữ là đồ vật', 'is/are/was/were + V3/ed', 'have sth done', 'need + V-ing'],
  },

  // ─── 3. CÂU ĐIỀU KIỆN & WISH ───
  {
    id: 'lesson_conditionals',
    topicId: 'grammar',
    subTopicId: 'conditionals',
    title: '3. Câu Điều Kiện (Conditionals), Unless & Câu Ước Wish',
    subTitle: 'Điều kiện Loại 1, Loại 2, Loại 3, Cấu trúc Unless, As long as, Câu ước Wish ở 3 mốc thời gian',
    summary: 'Chuyên đề xuất hiện 100% trong mọi đề thi vào lớp 10 cả phần trắc nghiệm và viết lại câu.',
    formulas: [
      {
        name: 'Điều kiện Loại 1 (Có thật ở hiện tại hoặc tương lai)',
        formula: 'If + S + V(hiện tại đơn), S + will / can / must / should + V-inf',
        example: 'If it rains tomorrow, we will cancel the picnic.',
        note: 'Dùng Unless = If... not. Ví dụ: If you don\'t study, you will fail <=> Unless you study, you will fail.',
      },
      {
        name: 'Điều kiện Loại 2 (Giả định trái ngược với thực tế ở hiện tại)',
        formula: 'If + S + V2/ed (to be dùng WERE cho mọi ngôi), S + would / could / might + V-inf',
        example: 'If I were you, I would take that opportunity. / If I had a car, I could drive to work.',
        note: 'Gặp câu thực tế ở hiện tại có "Because / So" => viết lại bằng câu điều kiện loại 2 (lùi thì và đảo ngược khẳng định/phủ định).',
      },
      {
        name: 'Điều kiện Loại 3 (Giả định trái ngược với quá khứ - Dành cho thi chuyên/điểm 9-10)',
        formula: 'If + S + had + V3/ed, S + would / could + have + V3/ed',
        example: 'If I had studied harder last year, I would have passed the exam.',
      },
      {
        name: 'Câu ước WISH / IF ONLY',
        formula: '1) Ước cho tương lai: S + wish + S + WOULD / COULD + V-inf\n2) Ước cho hiện tại: S + wish + S + V2/ed (were cho mọi ngôi)\n3) Ước cho quá khứ: S + wish + S + HAD + V3/ed',
        example: 'I wish I were taller. / She wishes she had a laptop. / I wish it wouldn\'t rain tomorrow.',
        note: 'TUYỆT ĐỐI KHÔNG BAO GIỜ dùng thì hiện tại sau WISH!',
      },
    ],
    rules: [
      {
        title: 'Quy tắc chuyển đổi câu với Unless',
        detail: 'Unless = If + not. Trong mệnh đề chứa Unless, động từ luôn ở dạng khẳng định (không có not/don\'t/doesn\'t).',
        examples: [
          'If you don\'t water the plants, they will die. ==> Unless you water the plants, they will die.',
          'If she doesn\'t hurry, she will miss the bus. ==> Unless she hurries, she will miss the bus.',
        ],
      },
      {
        title: 'Chuyển đổi câu thực tế (Because / So) sang câu điều kiện loại 2',
        detail: 'Nguyên tắc: Đảo ngược thực tế (Hiện tại khẳng định -> If phủ định; Hiện tại phủ định -> If khẳng định).',
        examples: [
          'I don\'t have money, so I can\'t buy a bike. ==> If I had money, I could buy a bike.',
          'Because he is lazy, he gets bad marks. ==> If he weren\'t lazy, he wouldn\'t get bad marks.',
        ],
      },
    ],
    examTips: [
      '⚡ Mẹo câu WISH: Nhìn thấy "wish" => GẠCH NGAY các đáp án chia ở thì hiện tại (is, am, are, have, V-s/es).',
      '⚡ Mẹo câu Unless: Gạch ngay đáp án có "Unless + don\'t / doesn\'t" vì Unless đã mang nghĩa phủ định.',
      '⚡ Đảo ngữ câu điều kiện: Loại 1: Should + S + V-inf; Loại 2: Were + S + to V / Were + S...',
    ],
    keySignals: ['If', 'Unless', 'Wish', 'If only', 'Or / Otherwise', 'As long as', 'Provided that'],
  },

  // ─── 4. MỆNH ĐỀ QUAN HỆ ───
  {
    id: 'lesson_relative_clauses',
    topicId: 'grammar',
    subTopicId: 'relative_clauses',
    title: '4. Mệnh Đề Quan Hệ (Relative Clauses) & Rút Gọn Mệnh Đề',
    subTitle: 'Who, Whom, Which, That, Whose, Where, When, Why và Kỹ thuật rút gọn bằng V-ing, V3/ed, To V',
    summary: 'Cách dùng các đại từ quan hệ để nối câu và các quy tắc đặc biệt bắt buộc phải dùng hoặc cấm dùng THAT.',
    formulas: [
      {
        name: 'Bảng Đại Từ Quan Hệ',
        formula: '• WHO: Thay cho Người (làm Chủ ngữ hoặc Tân ngữ)\n• WHOM: Thay cho Người (CHỈ làm Tân ngữ, đứng trước S + V hoặc sau Giới từ)\n• WHICH: Thay cho Vật (làm Chủ ngữ hoặc Tân ngữ)\n• THAT: Thay cho cả Người và Vật (dùng trong mệnh đề xác định)\n• WHOSE: Chỉ sở hữu (WHOSE + Noun)\n• WHERE (= in/at which), WHEN (= on/in which), WHY (= for which)',
        example: 'The man who won the prize is my teacher. / The book which is on the table is mine. / The boy whose bike was stolen is crying.',
      },
      {
        name: 'Rút gọn mệnh đề quan hệ (Dạng câu điểm 8-9)',
        formula: '1) Chủ động: Rút gọn thành V-ing\n2) Bị động: Rút gọn thành V3/ed\n3) Sau số thứ tự (the first, second, last, only, so sánh nhất): Rút gọn thành TO V-inf (hoặc TO BE V3/ed)',
        example: 'The man who is standing there -> The man standing there.\nThe bridge which was built in 1990 -> The bridge built in 1990.\nNeil Armstrong was the first man who walked on the moon -> was the first man to walk on the moon.',
      },
    ],
    rules: [
      {
        title: 'Khi nào KHÔNG ĐƯỢC DÙNG THAT? (2 trường hợp cấm kỵ)',
        detail: '1. Trong mệnh đề quan hệ có dấu phẩy "," (Mệnh đề không xác định).\n2. Đi ngay sau giới từ (in that -> SAI, phải dùng in which / with whom).',
        examples: [
          'Mr. Nam, who is my neighbor, is a doctor. (KHÔNG ĐƯỢC DÙNG: Mr. Nam, that...)',
          'The house in which I was born. (KHÔNG ĐƯỢC DÙNG: in that)',
        ],
      },
      {
        title: 'Khi nào BẮT BUỘC DÙNG THAT?',
        detail: 'Sau danh từ chỉ cả người và vật ("the men and animals"), sau tính từ so sánh nhất (the best, the most), sau all, every, nothing, everything, the only.',
        examples: [
          'He told us about the people and places that he had visited.',
          'This is the best film that I have ever watched.',
        ],
      },
    ],
    examTips: [
      '⚡ Mẹo loại trừ: Thấy có dấu phẩy "," trước chỗ trống => GẠCH NGAY đáp án THAT.',
      '⚡ Thấy có giới từ (in, on, at, with, about...) trước chỗ trống => CHỈ ĐƯỢC CHỌN WHOM (người) hoặc WHICH (vật).',
      '⚡ Thấy trước chỗ trống là danh từ chỉ người, sau chỗ trống là một danh từ khác => 99% chọn WHOSE (whose car, whose parents).',
    ],
    keySignals: ['who', 'whom', 'which', 'that', 'whose + N', 'where', 'when', 'the first/last/only to V'],
  },

  // ─── 5. CÂU GIÁN TIẾP ───
  {
    id: 'lesson_reported_speech',
    topicId: 'grammar',
    subTopicId: 'reported_speech',
    title: '5. Câu Gián Tiếp (Reported Speech) & Động Từ Tường Thuật Đặc Biệt',
    subTitle: 'Quy tắc lùi thì, đổi đại từ, đổi trạng từ chỉ thời gian/nơi chốn và câu hỏi trần thuật',
    summary: 'Chuyển đổi câu trực tiếp sang gián tiếp cho câu kể, câu hỏi Yes/No, câu hỏi Wh- và câu mệnh lệnh/khuyên nhủ.',
    formulas: [
      {
        name: 'Câu trần thuật (Statements)',
        formula: 'S + said (that) / told + O + S\' + V (lùi 1 thì)...',
        example: '"I am learning English now", Tom said. ==> Tom said that he was learning English then.',
      },
      {
        name: 'Câu hỏi Yes/No (Yes/No Questions)',
        formula: 'S + asked + O + IF / WHETHER + S\' + V (lùi thì, trật tự câu khẳng định)',
        example: '"Do you like tea?", she asked me. ==> She asked me if I liked tea.',
        note: 'TUYỆT ĐỐI KHÔNG đảo trợ động từ lên trước chủ ngữ trong câu gián tiếp!',
      },
      {
        name: 'Câu hỏi có từ để hỏi Wh- (Wh- Questions)',
        formula: 'S + asked + O + WH-word + S\' + V (lùi thì, trật tự câu khẳng định: S + V)',
        example: '"Where do you live?", he asked. ==> He asked me where I lived. (KHÔNG DÙNG: where did I live).',
      },
      {
        name: 'Các cấu trúc động từ tường thuật đặc biệt (Reported Verbs)',
        formula: '• S + advise / tell / ask / order / warn + O + (NOT) TO V-inf\n• S + suggest + V-ing / suggest that S + (should) + V-inf\n• S + apologize to O for + V-ing (xin lỗi)\n• S + thank O for + V-ing (cảm ơn)\n• S + congratulate O on + V-ing (chúc mừng)\n• S + accuse O of + V-ing (buộc tội)',
        example: '"You should study harder", the teacher said. ==> The teacher advised me to study harder.\n"Let\'s go to the cinema", Nam said. ==> Nam suggested going to the cinema.',
      },
    ],
    rules: [
      {
        title: 'Bảng quy tắc lùi thì và chuyển đổi trạng từ thời gian/nơi chốn',
        detail: '• Hiện tại đơn -> Quá khứ đơn\n• Hiện tại tiếp diễn -> Quá khứ tiếp diễn\n• Hiện tại hoàn thành / Quá khứ đơn -> Quá khứ hoàn thành (had + V3/ed)\n• Will -> Would; Can -> Could; Must -> Had to\n• Now -> Then; Today -> That day; Tonight -> That night\n• Yesterday -> The day before / The previous day\n• Tomorrow -> The following day / The next day\n• Ago -> Before; This -> That; These -> Those; Here -> There',
        examples: ['"I will meet you here tomorrow" ==> He said that he would meet me there the next day.'],
      },
    ],
    examTips: [
      '⚠️ Bẫy đề thi số 1: Giữ nguyên trật tự câu hỏi đảo ngữ "asked me where was I going" => SAI, phải là "where I was going".',
      '⚡ Mẹo câu SUGGEST: Gặp "Let\'s...", "Why don\'t we...", "Shall we..." => Viết lại bằng "S + suggested + V-ing" hoặc "suggested that S (should) + V-inf".',
    ],
    keySignals: ['said that', 'told me that', 'asked if/whether', 'advised to V', 'suggested V-ing', 'the following day'],
  },

  // ─── 6. PHÁT ÂM -S/ES VÀ -ED ───
  {
    id: 'lesson_pronunciation_rules',
    topicId: 'pronunciation',
    subTopicId: 'pronunciation_s_es',
    title: '6. Bí Kíp Phát Âm Đuôi -s/es, -ed & Âm Câm',
    subTitle: 'Câu thần chú ghi nhớ 100% ăn điểm trọn vẹn 2 câu ngữ âm trong đề thi vào 10',
    summary: 'Phương pháp nhận diện đuôi -s/es, -ed và các phụ âm câm phổ biến nhất trong đề tuyển sinh.',
    formulas: [
      {
        name: 'Quy tắc phát âm đuôi -s / -es (3 trường hợp)',
        formula: '1) Phát âm là /s/: Tận cùng bằng các âm vô thanh /p, k, f, t, θ/\n   👉 Câu thần chú: "Thời Phong Kiến Phương Tây" (-th, -p, -k, -f/-gh/-ph, -t)\n2) Phát âm là /ɪz/: Tận cùng bằng các âm xuýt /s, z, ʃ, tʃ, dʒ, ʒ/\n   👉 Nhận diện chữ cái: -s, -ss, -x, -ch, -sh, -z, -ge, -ce (watches, boxes, classes, bridges, places)\n3) Phát âm là /z/: Các trường hợp còn lại (nguyên âm và phụ âm hữu thanh: plays, dogs, pens, doors)',
        example: 'stops /s/, books /s/, laughs /s/, watches /ɪz/, kisses /ɪz/, changes /ɪz/, stays /z/, lives /z/.',
      },
      {
        name: 'Quy tắc phát âm đuôi -ed (3 trường hợp)',
        formula: '1) Phát âm là /ɪd/: Tận cùng là âm /t/ hoặc /d/\n   👉 Câu thần chú: "Tiền Đô" (wanted, needed, decided, visited)\n2) Phát âm là /t/: Tận cùng là các âm vô thanh /p, k, f, s, ʃ, tʃ/\n   👉 Câu thần chú: "Chính Phủ Phát Sách Không Thu Phí" (-ch, -p, -f/-gh, -s/-x/-ce, -k, -th, -sh)\n3) Phát âm là /d/: Các trường hợp còn lại (played, cleaned, loved, stayed)',
        example: 'wanted /ɪd/, looked /t/, washed /t/, laughed /t/, danced /t/, played /d/, cleaned /d/.',
      },
    ],
    rules: [
      {
        title: 'Ngoại lệ đuôi -ed phát âm là /ɪd/ trong tính từ (CỰC HAY THI BẪY)',
        detail: 'Một số từ tận cùng là -ed khi đóng vai trò là TÍNH TỪ luôn đọc là /ɪd/ dù trước đó không phải t hoặc d:',
        examples: [
          '• naked /ˈneɪkɪd/ (trần trụi)\n• wicked /ˈwɪkɪd/ (độc ác)\n• sacred /ˈseɪkrɪd/ (thiêng liêng)\n• beloved /bɪˈlʌvɪd/ (yêu quý)\n• learned /ˈlɜːnɪd/ (có học thức)\n• aged /ˈeɪdʒɪd/ (cao tuổi)',
        ],
      },
    ],
    examTips: [
      '⚡ Chữ tận cùng là "gh" hoặc "ph" mà đọc là /f/ (laughs, coughs, paragraphs) => đuôi -s đọc là /s/, đuôi -ed đọc là /t/.',
      '⚡ Các phụ âm câm hay ra thi: "k" trong knife, know, knee; "w" trong write, wrong, answer; "h" trong hour, honest, honor; "b" trong climb, doubt, debt.',
    ],
    keySignals: ['đuôi -s/es', 'đuôi -ed', 'thời phong kiến phương tây', 'tiền đô', 'chính phủ phát sách'],
  },

  // ─── 7. TRỌNG ÂM TỪ 2 & 3 ÂM TIẾT ───
  {
    id: 'lesson_stress_rules',
    topicId: 'stress',
    subTopicId: 'stress_2_syllables',
    title: '7. Quy Tắc Đánh Trọng Âm Từ 2 & 3 Âm Tiết & Hậu Tố',
    subTitle: 'Quy tắc từ loại, quy tắc hậu tố và các trường hợp ngoại lệ thường gặp',
    summary: 'Tổng hợp bí kíp xác định chính xác vị trí trọng âm mà không cần tra từ điển.',
    formulas: [
      {
        name: 'Trọng âm từ 2 âm tiết (Quy tắc Từ loại)',
        formula: '1) Danh từ & Tính từ 2 âm tiết: Trọng âm thường rơi vào ÂM TIẾT 1 (ví dụ: \'teacher, \'student, \'happy, \'famous, \'village)\n2) Động từ 2 âm tiết: Trọng âm thường rơi vào ÂM TIẾT 2 (ví dụ: de\'cide, pro\'tect, re\'ceive, a\'rrive, ex\'plain)',
        example: 'Noun/Adj: \'table, \'doctor, \'careful, \'modern. Verb: re\'lax, pro\'duce, pre\'fer, de\'stroy.',
        note: 'Ngoại lệ danh từ âm 2: ma\'chine, mis\'take, a\'dvice, po\'lice. Ngoại lệ động từ âm 1: \'borrow, \'happen, \'visit, \'listen, \'open, \'follow, \'enter.',
      },
      {
        name: 'Quy tắc Hậu tố (Suffixes) cho từ 3 âm tiết trở lên',
        formula: '1) Nhóm 1: Hậu tố nhận CHÍNH TRỌNG ÂM: -ee, -eer, -ese, -ique, -esque (employ\'ee, Chi\'nese, engin\'eer, pic\'turesque)\n2) Nhóm 2: Hậu tố làm trọng âm rơi vào ÂM TRƯỚC NÓ 1 âm: -tion, -sion, -ic, -ical, -ity, -logy, -graphy, -ial (pol\'lution, de\'cision, e\'lectric, mu\'sician, a\'bility)\n3) Nhóm 3: Hậu tố làm trọng âm rơi vào ÂM CÁCH NÓ 1 âm (âm 3 từ dưới lên): -ate, -ise/-ize, -fy, -ude (com\'municate, \'organize, \'beautify, \'attitude)',
        example: 'infor\'mation, scien\'tific, bi\'ology, econ\'omic, ap\'preciate.',
      },
    ],
    rules: [
      {
        title: 'Tiền tố và Hậu tố giữ nguyên trọng âm từ gốc',
        detail: 'Các tiền tố un-, im-, in-, dis-, re-, non-, mis- và hậu tố -ful, -less, -ly, -ment, -ness, -er, -or, -able, -ship KHÔNG LÀM THAY ĐỔI trọng âm của từ gốc.',
        examples: [
          '\'happy -> un\'happy -> \'happiness',
          'de\'velop -> de\'velopment',
          '\'care -> \'careful -> \'carefully -> \'careless',
        ],
      },
    ],
    examTips: [
      '⚡ Quy tắc âm yếu: Âm /ə/ (ơ ngắn) và /i/ ngắn KHÔNG BAO GIỜ nhận trọng âm (ví dụ: a\'bout, con\'tain, sup\'port, po\'lite).',
      '⚡ Động từ 2 âm tiết có âm cuối là nguyên âm đôi hoặc kết thúc bằng 2 phụ âm trở lên thì trọng âm rơi vào âm 2.',
    ],
    keySignals: ['-tion, -sion, -ic, -ity', '-ee, -ese, -eer', '-ate, -ize', 'Danh từ âm 1, Động từ âm 2'],
  },

  // ─── 8. DẠNG ĐÚNG CỦA TỪ (WORD FORM) ───
  {
    id: 'lesson_word_form',
    topicId: 'grammar',
    subTopicId: 'word_form_rules',
    title: '8. Dạng Đúng Của Từ (Word Form / Word Formation)',
    subTitle: 'Quy tắc vàng xác định vị trí Danh từ, Động từ, Tính từ, Trạng từ & Bảng tiền tố/hậu tố',
    summary: 'Chuyên đề phân loại điểm 8-9 trong cấu trúc đề thi tuyển sinh vào lớp 10.',
    formulas: [
      {
        name: 'Vị trí của Danh từ (Noun)',
        formula: '• Sau Mạo từ: a / an / the + Noun\n• Sau Tính từ sở hữu: my, your, his, her, their, our, its + Noun\n• Sau Từ chỉ số lượng: some, many, much, a lot of, few, little + Noun\n• Sau Giới từ: in, on, at, about, with, of, for + Noun\n• Sau Tính từ: Adj + Noun (ví dụ: beautiful weather)',
        example: 'He made a great contribution (N) to science. / The pollution (N) in this city is alarming.',
      },
      {
        name: 'Vị trí của Tính từ (Adjective)',
        formula: '• Đứng TRƯỚC Danh từ: Adj + Noun (a famous singer)\n• Đứng SAU Động từ TO BE: S + be + Adj (She is beautiful)\n• Đứng SAU Động từ chỉ tri giác/trạng thái: look, seem, appear, feel, sound, smell, taste, become, get + Adj\n• Cấu trúc: Make + O + Adj (The movie made me sad); Keep + O + Adj (Keep your room clean)',
        example: 'This soup tastes delicious (Adj). / Exercise keeps you healthy (Adj).',
      },
      {
        name: 'Vị trí của Trạng từ (Adverb)',
        formula: '• Đứng TRƯỚC hoặc SAU Động từ thường để bổ nghĩa cho động từ: V + Adv hoặc Adv + V\n• Đứng TRƯỚC Tính từ: Adv + Adj (extremely hot, beautifully decorated)\n• Đứng TRƯỚC một Trạng từ khác: Adv + Adv (very well)\n• Đứng ở ĐẦU CÂU có dấu phẩy: Adv, S + V (Fortunately, we caught the bus)',
        example: 'He drives carefully (Adv). / She sings extremely (Adv) well (Adv).',
      },
    ],
    rules: [
      {
        title: 'Bảng Tiền tố mang nghĩa phủ định (Negative Prefixes)',
        detail: '• un-: unhappy, unfriendly, uncomfortable\n• in-: inactive, convenient -> inconvenient\n• im- (trước p, m): polite -> impolite, possible -> impossible\n• il- (trước l): legal -> illegal, literate -> illiterate\n• ir- (trước r): regular -> irregular, responsible -> irresponsible\n• dis-: honest -> dishonest, agree -> disagree, appear -> disappear',
        examples: ['It is impossible to finish this project today.'],
      },
      {
        title: 'Bảng Hậu tố tạo Danh từ phổ biến',
        detail: '• Hậu tố chỉ Người: -er (teacher), -or (actor), -ist (scientist), -ant (assistant)\n• Hậu tố chỉ Sự việc/Khái niệm: -tion (pollution), -sion (decision), -ment (development), -ness (happiness), -ity (ability), -ance/-ence (importance, difference)',
        examples: ['Environmentalists (N chỉ người) are trying to protect the forests.'],
      },
    ],
    examTips: [
      '⚡ Quy tắc 3 bước làm bài Word Form:\n  1. Đọc câu và xác định từ loại cần điền (N, V, Adj, hay Adv) dựa vào từ đứng trước và sau chỗ trống.\n  2. Xem xét ngữ cảnh mang nghĩa khẳng định hay PHỦ ĐỊNH (cần thêm tiền tố un-, im-, dis-...).',
    ],
    keySignals: ['Adj + N', 'Be + Adj', 'V + Adv', 'Make + O + Adj', 'Negative prefixes'],
  },

  // ─── 9. V-ING VS TO V-INF ───
  {
    id: 'lesson_gerund_infinitive',
    topicId: 'grammar',
    subTopicId: 'gerund_infinitive',
    title: '9. Danh Động Từ & Động Từ Nguyên Mẫu (V-ing vs To V-inf)',
    subTitle: 'Bảng động từ đi với V-ing, đi với To V và các động từ đặc biệt đổi nghĩa',
    summary: 'Chuyên đề xuất hiện trong hầu hết các câu trắc nghiệm ngữ pháp và chọn dạng đúng của động từ.',
    formulas: [
      {
        name: 'Nhóm động từ theo sau là V-ING (Gerund)',
        formula: 'S + V (enjoy, avoid, mind, suggest, practice, spend time, finish, consider, deny, keep, fancy, miss...) + V-ING',
        example: 'I enjoy reading books. / Would you mind opening the door? / He spent 2 hours doing his homework.',
        note: 'Tất cả các GIỚI TỪ (in, on, at, about, without, of, for, with...) luôn đi với V-ING (look forward to + V-ing, be used to + V-ing).',
      },
      {
        name: 'Nhóm động từ theo sau là TO V-INF',
        formula: 'S + V (want, decide, hope, plan, refuse, promise, agree, offer, manage, afford, tend, choose, hesitate...) + TO V-INF',
        example: 'She decided to study abroad. / We promised to help him.',
      },
      {
        name: 'Nhóm động từ ĐỔI NGHĨA khi đi với V-ing hoặc To V (CỰC KỲ HAY THI)',
        formula: '1) REMEMBER / FORGET / REGRET:\n   • + TO V: Nhớ/Quên/Hối tiếc phải làm việc gì (chưa làm/tương lai)\n   • + V-ING: Nhớ/Quên/Hối tiếc đã làm việc gì (trong quá khứ)\n2) STOP:\n   • STOP + TO V: Dừng việc đang làm ĐỂ LÀM VIỆC KHÁC\n   • STOP + V-ING: Dừng hẳn hành động đang làm\n3) TRY:\n   • TRY + TO V: Cố gắng làm gì\n   • TRY + V-ING: Thử làm gì\n4) NEED:\n   • S(người) + NEED + TO V: Ai cần làm gì\n   • S(vật) + NEED + V-ING (= need to be V3): Cái gì cần được làm',
        example: 'Remember to lock the door before leaving. (Nhớ khóa cửa - chưa làm)\nI remember meeting him in Da Nang last year. (Nhớ đã gặp trong quá khứ)\nHe stopped smoking. (Bỏ thuốc lá) / He stopped to smoke. (Dừng lại để hút thuốc)',
      },
    ],
    rules: [
      {
        title: 'Các cấu trúc cố định đi với V-ing hay ra bẫy',
        detail: '• look forward to + V-ing (trông đợi)\n• be/get used to + V-ing (quen với)\n• it\'s no use / it\'s no good + V-ing (chẳng có ích gì)\n• can\'t help / can\'t stand + V-ing (không thể nhịn/chịu được)\n• would you mind + V-ing? (bạn có phiền...)',
        examples: ['I am looking forward to seeing you soon.'],
      },
    ],
    examTips: [
      '⚡ Cụm "look forward to" có chữ "to" là giới từ, nên động từ sau đó BẮT BUỘC là V-ing (looking forward to hearing from you).',
      '⚡ Phân biệt: "Used to + V-inf" (Đã từng trong quá khứ) vs "Be/Get used to + V-ing" (Quen với ở hiện tại).',
    ],
    keySignals: ['enjoy + V-ing', 'decide + to V', 'remember to V / V-ing', 'stop to V / V-ing', 'look forward to + V-ing'],
  },

  // ─── 10. PHRASAL VERBS ───
  {
    id: 'lesson_phrasal_verbs',
    topicId: 'vocabulary',
    subTopicId: 'phrasal_verbs_grade9',
    title: '10. Cụm Động Từ (Phrasal Verbs) Trọng Tâm SGK Lớp 9',
    subTitle: 'Toàn bộ các cụm động từ xuất hiện trong 12 Unit SGK và đề thi tuyển sinh vào 10',
    summary: 'Nắm chắc ý nghĩa và ngữ cảnh sử dụng của các Phrasal Verbs phổ biến nhất.',
    formulas: [
      {
        name: 'Nhóm Phrasal Verbs Unit 1 - 6 (Chủ đề Làng nghề, Đô thị, Áp lực)',
        formula: '• pass down: truyền lại cho thế hệ sau (Crafts are passed down from generation to generation)\n• live on: sống dựa vào (They live on making pottery)\n• deal with: giải quyết, đối phó (deal with traffic congestion)\n• close down: phá sản, đóng cửa vĩnh viễn (The factory closed down)\n• face up to: đối mặt với (face up to reality/stress)\n• turn down: từ chối (turn down an invitation/offer) hoặc vặn nhỏ âm lượng\n• set up: thành lập (set up a business/club)\n• set off: khởi hành (set off on a journey)',
        example: 'My grandparents passed down the traditional pottery techniques to my father.',
      },
      {
        name: 'Nhóm Phrasal Verbs Unit 7 - 12 (Chủ đề Du lịch, Nghề nghiệp, Không gian)',
        formula: '• look after: chăm sóc (= take care of)\n• look for: tìm kiếm\n• look forward to: mong chờ, trông đợi\n• give up: từ bỏ (= stop doing)\n• turn on / off: bật / tắt (turn on the light, turn off the fan)\n• take off: cất cánh (máy bay) hoặc cởi (quần áo/giày dép)\n• put on: mặc vào, đeo vào\n• run out of: hết, cạn kiệt (run out of money/petrol)\n• keep up with: bắt kịp, theo kịp (= catch up with)',
        example: 'He gave up smoking 2 years ago. / The plane took off on time.',
      },
    ],
    rules: [
      {
        title: 'Vị trí của Đại từ tân ngữ với Phrasal Verbs',
        detail: 'Nếu tân ngữ là đại từ (it, them, him, her, me), nó BẮT BUỘC phải đứng ở GIỮA động từ và giới từ.',
        examples: [
          'Turn it on (ĐÚNG) - KHÔNG DÙNG: Turn on it.',
          'Take them off (ĐÚNG) - KHÔNG DÙNG: Take off them.',
        ],
      },
    ],
    examTips: [
      '⚡ Mẹo: "turn down" có 2 nghĩa: 1) vặn nhỏ âm lượng (turn down the radio); 2) từ chối lời mời/công việc (turn down the job offer).',
      '⚡ "look after" = take care of (chăm sóc); "look for" = search for (tìm kiếm); "look up" = tra từ điển (look up the word in the dictionary).',
    ],
    keySignals: ['look after', 'give up', 'turn down', 'pass down', 'set up', 'take off', 'run out of'],
  },

  // ─── 11. CÂU SO SÁNH & SO SÁNH KÉP ───
  {
    id: 'lesson_comparisons',
    topicId: 'grammar',
    subTopicId: 'comparisons_rules',
    title: '11. Câu So Sánh (Comparisons) & So Sánh Kép (Double Comparisons)',
    subTitle: 'So sánh hơn, so sánh nhất, so sánh bằng và cấu trúc "Càng... càng..." (The more... the more...)',
    summary: 'Chuyên đề xuất hiện ở cả phần trắc nghiệm nhận biết và phần viết lại câu nâng cao.',
    formulas: [
      {
        name: 'So sánh Bằng (Equality)',
        formula: 'S1 + V + as + adj/adv + as + S2\nPhủ định: S1 + V(not) + as / so + adj/adv + as + S2',
        example: 'He is as tall as his father. / This book is not so interesting as that one.',
      },
      {
        name: 'So sánh Hơn (Comparative)',
        formula: '• Tính từ ngắn: S1 + be + adj-ER + THAN + S2 (taller than, faster than)\n• Tính từ dài: S1 + be + MORE + adj + THAN + S2 (more beautiful than)\n• Nhấn mạnh: much / far / a lot + so sánh hơn (much taller)',
        example: 'London is much more expensive than Hanoi.',
      },
      {
        name: 'So sánh Kép "Càng... càng..." (The more... the more...) - RẤT HAY THI',
        formula: 'The + so sánh hơn (S + V), the + so sánh hơn (S + V)',
        example: 'The older he gets, the wiser he becomes.\nThe more you study, the better results you will get.',
      },
    ],
    rules: [
      {
        title: 'Bảng tính từ bất quy tắc trong so sánh',
        detail: '• good / well -> better -> the best\n• bad / badly -> worse -> the worst\n• many / much -> more -> the most\n• little -> less -> the least\n• far -> farther / further -> the farthest / furthest',
        examples: ['His health is getting worse (NOT: badder).'],
      },
    ],
    examTips: [
      '⚡ Mẹo câu so sánh kép: Thấy có cấu trúc "The + so sánh hơn" ở vế 1 thì vế 2 BẮT BUỘC cũng phải bắt đầu bằng "The + so sánh hơn" (The harder you work, the more money you earn).',
      '⚡ Phân biệt "as... as" với "like": Sau as... as là mệnh đề hoặc đại từ, sau like là danh từ.',
    ],
    keySignals: ['as... as', 'more... than', 'the most', 'the more... the more...', 'better', 'worse'],
  },

  // ─── 12. CÂU HỎI ĐUÔI (TAG QUESTIONS) ───
  {
    id: 'lesson_tag_questions',
    topicId: 'grammar',
    subTopicId: 'tag_questions',
    title: '12. Câu Hỏi Đuôi (Tag Questions) & 8 Trường Hợp Đặc Biệt',
    subTitle: 'Quy tắc khẳng định <-> phủ định và toàn bộ các bẫy đề thi tuyển sinh',
    summary: 'Chuyên đề dễ lấy trọn 0.25 - 0.5 điểm nếu nắm vững các trường hợp ngoại lệ.',
    formulas: [
      {
        name: 'Quy tắc chung',
        formula: '• Mệnh đề chính KHẲNG ĐỊNH  ==>  Đuôi PHỦ ĐỊNH (S + V  ==>  trợ V + not + đại từ S?)\n• Mệnh đề chính PHỦ ĐỊNH  ==>  Đuôi KHẲNG ĐỊNH (S + trợ V + not + V  ==>  trợ V + đại từ S?)',
        example: 'You are a student, aren\'t you? / She doesn\'t like coffee, does she? / Tom went to school, didn\'t he?',
      },
      {
        name: '8 Trường hợp đặc biệt BẮT BUỘC THUỘC LÒNG',
        formula: '1) I am...  ==>  aren\'t I? (Ví dụ: I am late, aren\'t I?)\n2) Let\'s + V...  ==>  shall we? (Ví dụ: Let\'s go for a walk, shall we?)\n3) Câu mệnh lệnh: Open the door...  ==>  will you? / Don\'t be late...  ==>  will you?\n4) Chủ ngữ là đại từ bất định chỉ người (Everyone, Somebody, Nobody, Anyone...)  ==>  Đuôi dùng đại từ "THEY"\n5) Chủ ngữ là đại từ bất định chỉ vật (Everything, Nothing, Something...)  ==>  Đuôi dùng đại từ "IT"\n6) Mệnh đề có từ mang nghĩa phủ định (Never, Seldom, Hardly, Rarely, Little, Few, Nobody, Nothing)  ==>  Đuôi dùng KHẲNG ĐỊNH\n7) Chủ ngữ là "This / That"  ==>  Đuôi dùng "IT"; "These / Those"  ==>  Đuôi dùng "THEY"\n8) S + wish...  ==>  may I? (I wish to go now, may I?)',
        example: 'Nobody called me, did they? (Nobody mang nghĩa phủ định, đại từ thay thế là they)\nNothing is wrong, is it? (Nothing mang nghĩa phủ định, đại từ thay thế là it)\nHe hardly ever studies, does he? (hardly mang nghĩa phủ định)',
      },
    ],
    rules: [
      {
        title: 'Cấu trúc I think / I believe that...',
        detail: 'Nếu chủ ngữ là "I think / believe / suppose that + S + V" => Câu hỏi đuôi chia THEO MỆNH ĐỀ SAU "THAT" (nếu có not ở I don\'t think thì vế sau được coi là phủ định).',
        examples: [
          'I think she is rich, isn\'t she?',
          'I don\'t think he will come, will he? (don\'t think làm câu mang nghĩa phủ định)',
        ],
      },
    ],
    examTips: [
      '⚡ Cẩn thận từ phủ định ẩn: "hardly", "never", "seldom", "rarely", "scarcely", "nobody", "nothing" => Câu hỏi đuôi PHẢI Ở DẠNG KHẲNG ĐỊNH (+).',
    ],
    keySignals: ['aren\'t I?', 'shall we?', 'will you?', 'did they?', 'hardly/never', 'nobody/nothing'],
  },

  // ─── 13. LIÊN TỪ & TRẠNG TỪ LIÊN KẾT ───
  {
    id: 'lesson_connectors',
    topicId: 'grammar',
    subTopicId: 'connectors_rules',
    title: '13. Liên Từ & Trạng Từ Liên Kết (Connectors & Conjunctions)',
    subTitle: 'Although, In spite of, Because, Due to, So that, In order to, However, Therefore',
    summary: 'Phân biệt mệnh đề (S + V) và cụm danh từ/V-ing để chọn liên từ chính xác.',
    formulas: [
      {
        name: 'Chỉ Sự Nhượng Bộ (Mặc dù... nhưng...)',
        formula: '• Đi với MỆNH ĐỀ (S + V): Although / Even though / Though + S + V\n• Đi với CỤM DANH TỪ hoặc V-ING: In spite of / Despite + Noun phrase / V-ing',
        example: 'Although it rained heavily, they went out. ==> Despite the heavy rain, they went out.',
      },
      {
        name: 'Chỉ Nguyên Nhân - Kết Quả (Bởi vì...)',
        formula: '• Đi với MỆNH ĐỀ (S + V): Because / Since / As + S + V\n• Đi với CỤM DANH TỪ hoặc V-ING: Because of / Due to / Owing to + Noun phrase / V-ing',
        example: 'Because he was ill, he stayed at home. ==> Because of his illness, he stayed at home.',
      },
      {
        name: 'Chỉ Mục Đích (Để mà...)',
        formula: '• Đi với MỆNH ĐỀ (S + V): So that / In order that + S + can/could/will/would + V-inf\n• Đi với ĐỘNG TỪ: In order to / So as to / To + V-inf (Phủ định: in order not to / so as not to + V-inf)',
        example: 'He studies hard so that he can pass the exam. ==> He studies hard in order to pass the exam.',
      },
    ],
    rules: [
      {
        title: 'Trạng từ liên kết đứng giữa hai dấu phẩy hoặc sau dấu chấm phẩy',
        detail: '• However (tuy nhiên): S + V; however, S + V (hoặc S + V. However, S + V)\n• Therefore (do đó, vì vậy): S + V; therefore, S + V\n• Moreover / Furthermore (hơn nữa): thêm ý\n• Otherwise (nếu không thì): cảnh báo hậu quả',
        examples: ['He studied hard; however, he didn\'t pass the exam.'],
      },
    ],
    examTips: [
      '⚡ Mẹo phân biệt: Thấy sau chỗ trống có ĐỘNG TỪ CHIA THÌ (S + V) => Chọn Although / Because. Thấy sau chỗ trống chỉ có Cụm danh từ / V-ing => Chọn Despite / Because of.',
      '⚡ Despite / In spite of + the fact that + S + V.',
    ],
    keySignals: ['Although <-> Despite', 'Because <-> Because of', 'So that <-> In order to', 'However', 'Therefore'],
  },

  // ─── 14. KỸ NĂNG ĐỌC HIỂU & ĐIỀN TỪ ───
  {
    id: 'lesson_reading_cloze',
    topicId: 'reading',
    subTopicId: 'reading_strategies',
    title: '14. Chiến Thuật Đọc Hiểu (Reading) & Đọc Điền Từ (Cloze Test)',
    subTitle: 'Kỹ thuật Skimming, Scanning, tìm ý chính (Main Idea), từ quy chiếu và đoán nghĩa từ mới',
    summary: 'Phương pháp giải quyết trọn vẹn 10 - 15 câu đọc hiểu trong đề thi mà không cần hiểu hết 100% từ vựng.',
    formulas: [
      {
        name: 'Chiến thuật 3 bước làm bài Đọc hiểu văn bản',
        formula: '• Bước 1: Đọc nhanh câu đầu và câu cuối của mỗi đoạn để nắm Chủ đề & Ý chính (Skimming trong 30 giây).\n• Bước 2: Đọc câu hỏi và gạch chân TỪ KHÓA (Keywords: tên riêng, con số, thời gian, thuật ngữ).\n• Bước 3: Rà soát từ khóa trong bài đọc (Scanning) và so sánh câu chứa thông tin với 4 đáp án.',
        example: 'Câu hỏi: "According to paragraph 2, when was the bridge built?" -> Keyword: "bridge built, paragraph 2".',
      },
      {
        name: 'Bí kíp xử lý các dạng câu hỏi đọc hiểu điển hình',
        formula: '1) Câu hỏi Ý chính (Main idea / Title): Thường nằm ở 1-2 câu đầu đoạn 1 hoặc câu kết bài.\n2) Câu hỏi Từ quy chiếu ("The word \'IT / THEY\' in line 5 refers to..."): Đọc ngược lại câu văn ĐỨNG TRƯỚC nó để tìm danh từ số ít/số nhiều tương ứng.\n3) Câu hỏi Thông tin KHÔNG đúng ("NOT true / EXCEPT"): Tìm và loại trừ 3 đáp án có trong bài, đáp án còn lại là đáp án cần chọn.\n4) Câu hỏi Từ đồng nghĩa trong ngữ cảnh: Thay lần lượt 4 đáp án vào vị trí từ trong câu xem câu nào giữ nguyên ý nghĩa mạch lạc nhất.',
        example: 'The word "they" in paragraph 2 refers to: A. artisans  B. tourists  C. crafts  D. villages',
      },
    ],
    rules: [
      {
        title: 'Bí kíp làm bài Đọc điền từ vào đoạn văn (Cloze Test)',
        detail: '1. Nhìn từ đứng NGAY TRƯỚC và NGAY SAU chỗ trống để xác định xem cần điền Giới từ, Liên từ, Đại từ quan hệ hay Từ loại gì.\n2. Phân biệt các từ hay gây nhầm lẫn (Collocations): make a decision (NOT: do a decision), take a photo, do homework, give a hand.',
        examples: ['Global warming has a negative effect _______ (on) the environment.'],
      },
    ],
    examTips: [
      '⚡ Không bao giờ dịch từng chữ từ đầu đến cuối trước khi đọc câu hỏi. Hãy đọc câu hỏi trước để có định hướng tìm kiếm thông tin!',
      '⚡ Đáp án chứa các từ tuyệt đối như "always", "never", "only", "completely" thường là đáp án SAI.',
    ],
    keySignals: ['main idea', 'according to the passage', 'refers to', 'NOT true / EXCEPT', 'closest in meaning'],
  },

  // ─── 15. 15 MẪU CÂU VIẾT LẠI KINH ĐIỂN ───
  {
    id: 'lesson_sentence_transformation',
    topicId: 'sentence_rewrite',
    subTopicId: 'rewrite_connectors',
    title: '15. Tuyệt Chiêu 15 Mẫu Câu Viết Lại Kinh Điển (Sentence Transformation)',
    subTitle: 'Tổng hợp 15 cặp cấu trúc biến đổi câu xuất hiện 100% trong đề thi tuyển sinh vào lớp 10',
    summary: 'Luyện thành thạo 15 mẫu câu này để nắm chắc trọn vẹn điểm phần viết lại câu / trắc nghiệm đồng nghĩa.',
    formulas: [
      {
        name: 'Mẫu 1: So... that / Such... that <==> Too... to / Enough',
        formula: '• S + be/V + SO + adj/adv + THAT + S + V\n<==> S + be/V + SUCH + (a/an) + adj + N + THAT + S + V\n<==> S + be + TOO + adj + (for O) + TO V-inf\n<==> S + be + adj + ENOUGH + (for O) + TO V-inf',
        example: 'The weather was so bad that we couldn\'t go out.\n<=> It was such bad weather that we couldn\'t go out.\n<=> The weather was too bad for us to go out.',
      },
      {
        name: 'Mẫu 2: It takes [time] to V <==> Spend [time] V-ing',
        formula: 'It takes/took + O + [time] + TO V-inf  <==>  S + spend/spent + [time] + V-ING',
        example: 'It takes me 30 minutes to walk to school. <=> I spend 30 minutes walking to school.',
      },
      {
        name: 'Mẫu 3: S + prefer... to... <==> S + would rather... than...',
        formula: 'S + prefer + V-ing / N + TO + V-ing / N  <==>  S + would rather + V-inf + THAN + V-inf',
        example: 'I prefer drinking tea to coffee. <=> I would rather drink tea than coffee.',
      },
      {
        name: 'Mẫu 4: How about / What about / Why don\'t we <==> S + suggest + V-ing',
        formula: 'How about + V-ing? / Why don\'t we + V-inf? / Let\'s + V-inf  <==>  S + suggested + V-ING',
        example: '"Why don\'t we go swimming?", Tom said. <=> Tom suggested going swimming.',
      },
    ],
    rules: [
      {
        title: 'Mẹo vàng chuyển đổi: "Tính Trước - Danh Sau" với ENOUGH',
        detail: 'Tính từ luôn đứng TRƯỚC enough (rich enough, old enough), còn danh từ luôn đứng SAU enough (enough money, enough time).',
        examples: [
          'He is not old enough to drive a car.',
          'I don\'t have enough money to buy that phone.',
        ],
      },
    ],
    examTips: [
      '⚡ Khi chuyển từ TOO... TO sang SO... THAT, câu sau "THAT" PHẢI CÓ TỪ PHỦ ĐỊNH (can\'t / couldn\'t).',
      '⚡ Nhớ kiểm tra thì của câu gốc: Nếu câu gốc là quá khứ (was, spent, took) thì câu viết lại cũng phải ở quá khứ (couldn\'t, were, had).',
    ],
    keySignals: ['so... that', 'such... that', 'too... to', 'enough to', 'spend time V-ing', 'prefer to', 'would rather than'],
  },
];
