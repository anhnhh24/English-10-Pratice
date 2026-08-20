import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TOPICS_META } from '../data/topicsMeta';
import { MATH_TOPICS_META } from '../data/mathTopicsMeta';
import { DifficultyLevel, Question, TopicId, SubTopicId, Exam, UserAccount, SubjectId, RealtimeActivityEvent } from '../types';
import {
  getStoredRealtimeActivities,
  subscribeToRealtimeActivities,
  broadcastRemoteTask,
  logAndBroadcastActivity,
} from '../services/realtimeSyncService';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Download,
  Search,
  CheckCircle2,
  Layers,
  GraduationCap,
  Users,
  Check,
  X,
  Award,
  TrendingUp,
  Target,
  Clock,
  BookMarked,
  AlertTriangle,
  Flame,
  ArrowRight,
  Eye,
  MessageSquare,
  Sparkles,
  BarChart2,
  Calendar,
  Lock,
  Unlock,
  UserCheck,
  FileText,
  UserPlus,
  Radio,
  Send,
  Zap,
  Bell,
  Activity,
  HeartHandshake,
  Database,
  Cloud,
} from 'lucide-react';
import { CloudSyncModal } from './CloudSyncModal';

export const AdminPanel: React.FC = () => {
  const {
    currentUser,
    usersList,
    switchUser,
    register,
    toggleUserLock,
    getUserScopedData,
    saveTeacherNote,
    getTeacherNote,
    questions,
    exams,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addExam,
    deleteExam,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'realtime_pulse' | 'students' | 'questions' | 'exams'>('overview');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<'all' | 'math' | 'english'>('all');
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>('');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<UserAccount | null>(null);

  // Real-time Activities State
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeActivityEvent[]>(() => getStoredRealtimeActivities());
  const [liveToast, setLiveToast] = useState<RealtimeActivityEvent | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);

  // Remote Task Assignment State
  const [showAssignTaskModal, setShowAssignTaskModal] = useState<boolean>(false);
  const [taskTargetStudentId, setTaskTargetStudentId] = useState<string>('user_student_1');
  const [taskSubject, setTaskSubject] = useState<SubjectId>('math');
  const [taskTitle, setTaskTitle] = useState<string>('Đề Thi Thử Tuyển Sinh Vào 10 Môn Toán - Đề Số 01');
  const [taskMessage, setTaskMessage] = useState<string>('Em hãy hoàn thành đề thi thử này trong 60 phút và chú ý câu Vi-ét nhé!');
  const [taskAssignedExamId, setTaskAssignedExamId] = useState<string>('math_exam_official_01');
  const [taskSuccessMsg, setTaskSuccessMsg] = useState<boolean>(false);

  // Sibling Focus Id (default to first student)
  const [siblingId, setSiblingId] = useState<string>('user_student_1');

  // Cloud DB Modal
  const [showCloudModal, setShowCloudModal] = useState<boolean>(false);

  // Teacher feedback note state for inspected student
  const [teacherNoteInput, setTeacherNoteInput] = useState<string>('');
  const [teacherNoteSaved, setTeacherNoteSaved] = useState<boolean>(false);

  // New Student Modal
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentEmail, setNewStudentEmail] = useState<string>('');
  const [newStudentPassword, setNewStudentPassword] = useState<string>('123');
  const [newStudentSchool, setNewStudentSchool] = useState<string>('THPT Chu Văn An');
  const [newStudentTargetMath, setNewStudentTargetMath] = useState<number>(8.5);
  const [newStudentTargetEng, setNewStudentTargetEng] = useState<number>(8.5);
  const [addStudentMsg, setAddStudentMsg] = useState<string | null>(null);

  // Question Management States
  const [searchQuestionQuery, setSearchQuestionQuery] = useState<string>('');
  const [selectedQuestionTopic, setSelectedQuestionTopic] = useState<string>('all');
  const [showQModal, setShowQModal] = useState<boolean>(false);
  const [editingQ, setEditingQ] = useState<Question | null>(null);

  // Question form
  const [qSubject, setQSubject] = useState<SubjectId>('english');
  const [topicId, setTopicId] = useState<TopicId>('grammar');
  const [subTopicId, setSubTopicId] = useState<SubTopicId>('tenses');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [passage, setPassage] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [opt0, setOpt0] = useState<string>('');
  const [opt1, setOpt1] = useState<string>('');
  const [opt2, setOpt2] = useState<string>('');
  const [opt3, setOpt3] = useState<string>('');
  const [correctOption, setCorrectOption] = useState<number>(0);
  const [explanation, setExplanation] = useState<string>('');
  const [grammarRule, setGrammarRule] = useState<string>('');
  const [commonMistakeTip, setCommonMistakeTip] = useState<string>('');

  // Exam form
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [examSubject, setExamSubject] = useState<SubjectId>('math');
  const [examTitle, setExamTitle] = useState<string>('');
  const [examCode, setExamCode] = useState<string>('DE-10-M04');
  const [examDesc, setExamDesc] = useState<string>('');
  const [examTime, setExamTime] = useState<number>(60);
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);

  // Real-time Activity Subscription
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeActivities((event) => {
      setRealtimeEvents((prev) => [event, ...prev.filter((e) => e.id !== event.id)].slice(0, 50));
      setLiveToast(event);
      setTimeout(() => setLiveToast(null), 5000);
    });

    return () => unsubscribe();
  }, []);

  // Calculate Aggregate Class Performance
  const studentUsers = usersList.filter((u) => u.role === 'student');

  const allStudentStats = studentUsers.map((stu) => {
    const data = getUserScopedData(stu.id);
    const attempts = data.examAttempts || [];
    const mathAttempts = attempts.filter((a) => (a.subject || 'english') === 'math');
    const engAttempts = attempts.filter((a) => (a.subject || 'english') === 'english');

    const avgMath =
      mathAttempts.length > 0
        ? parseFloat((mathAttempts.reduce((s, a) => s + a.score, 0) / mathAttempts.length).toFixed(2))
        : 8.0;

    const avgEng =
      engAttempts.length > 0
        ? parseFloat((engAttempts.reduce((s, a) => s + a.score, 0) / engAttempts.length).toFixed(2))
        : 8.2;

    const activeMistakes = Object.values(data.mistakes || {}).filter((m) => !m.mastered);

    const totalQuestionsSolved = attempts.reduce((acc, a) => acc + (a.totalQuestions || 0), 0) + 15;
    const totalCorrect = attempts.reduce((acc, a) => acc + (a.correctCount || 0), 0) + 12;
    const accuracy = Math.round((totalCorrect / (totalQuestionsSolved || 1)) * 100);

    const targetMath = stu.targetScoreMath || stu.targetScore || 8.5;
    const targetEng = stu.targetScoreEnglish || stu.targetScore || 8.5;
    const isTargetReached = avgMath >= targetMath - 0.5 && avgEng >= targetEng - 0.5;

    return {
      student: stu,
      attempts,
      mathAttempts,
      engAttempts,
      avgMath,
      avgEng,
      activeMistakesCount: activeMistakes.length,
      accuracy,
      totalAttemptsCount: attempts.length,
      isTargetReached,
      teacherNote: getTeacherNote(stu.id),
    };
  });

  // Class Overview Stats
  const totalStudents = studentUsers.length;
  const totalSubmissions = allStudentStats.reduce((s, st) => s + st.totalAttemptsCount, 0);
  const classAvgMath =
    allStudentStats.length > 0
      ? parseFloat((allStudentStats.reduce((s, st) => s + st.avgMath, 0) / allStudentStats.length).toFixed(2))
      : 8.3;
  const classAvgEng =
    allStudentStats.length > 0
      ? parseFloat((allStudentStats.reduce((s, st) => s + st.avgEng, 0) / allStudentStats.length).toFixed(2))
      : 8.4;
  const targetReachCount = allStudentStats.filter((st) => st.isTargetReached).length;
  const targetReachPercent = Math.round((targetReachCount / (totalStudents || 1)) * 100);
  const totalClassMistakes = allStudentStats.reduce((s, st) => s + st.activeMistakesCount, 0);

  // Sibling Focus Stat
  const siblingStat = allStudentStats.find((s) => s.student.id === siblingId) || allStudentStats[0];

  // Filtered student list
  const filteredStudents = allStudentStats.filter(({ student }) => {
    const q = searchStudentQuery.toLowerCase();
    const matchName = student.name.toLowerCase().includes(q);
    const matchEmail = student.email.toLowerCase().includes(q);
    const matchSchool = (student.targetSchool || '').toLowerCase().includes(q);
    return matchName || matchEmail || matchSchool;
  });

  // Inspector handlers
  const handleOpenStudentDetail = (stu: UserAccount) => {
    setSelectedStudentForDetail(stu);
    setTeacherNoteInput(getTeacherNote(stu.id) || '');
    setTeacherNoteSaved(false);
  };

  const handleSaveTeacherNote = () => {
    if (!selectedStudentForDetail) return;
    saveTeacherNote(selectedStudentForDetail.id, teacherNoteInput);
    setTeacherNoteSaved(true);
    setTimeout(() => setTeacherNoteSaved(false), 2500);
  };

  // Remote Task Send Handler
  const handleSendRemoteTask = (e: React.FormEvent) => {
    e.preventDefault();
    broadcastRemoteTask({
      senderName: currentUser.name || 'Anh/Chị (Người giám sát)',
      recipientUserId: taskTargetStudentId,
      subject: taskSubject,
      title: taskTitle,
      message: taskMessage,
      assignedExamId: taskAssignedExamId,
    });
    setTaskSuccessMsg(true);
    setTimeout(() => {
      setTaskSuccessMsg(false);
      setShowAssignTaskModal(false);
    }, 1500);
  };

  // Live Test Simulation Trigger
  const handleSimulateStudentExam = (score: number) => {
    const targetStu = studentUsers.find((s) => s.id === siblingId) || studentUsers[0];
    logAndBroadcastActivity({
      userId: targetStu.id,
      userName: `${targetStu.name} (Em tôi)`,
      avatarColor: targetStu.avatarColor,
      subject: 'math',
      type: 'exam_submitted',
      title: `Vừa nộp bài thi Môn Toán (${score}/10đ)`,
      detail: `Đạt ${score}/10 điểm • Đề Thi Thử Vào 10 Chuẩn Sở GD&ĐT`,
      score,
      examTitle: 'Đề Thi Thử Tuyển Sinh Vào Lớp 10 Môn Toán (Sở GD&ĐT)',
    });
  };

  const handleSimulateStudentMistake = () => {
    const targetStu = studentUsers.find((s) => s.id === siblingId) || studentUsers[0];
    logAndBroadcastActivity({
      userId: targetStu.id,
      userName: `${targetStu.name} (Em tôi)`,
      avatarColor: targetStu.avatarColor,
      subject: 'math',
      type: 'question_wrong',
      title: 'Làm sai câu hỏi Hệ thức Vi-ét',
      detail: 'Sai câu tìm tham số m để phương trình có 2 nghiệm đối xứng',
      topicName: 'Phương trình bậc hai & Vi-ét',
    });
  };

  const [adminEmail, setAdminEmail] = useState<string>('admin');
  const [adminPass, setAdminPass] = useState<string>('123');
  const [adminError, setAdminError] = useState<string | null>(null);

  // If NOT logged in as Admin, show Dedicated Secure Admin Gateway Portal
  if (currentUser.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-in fade-in">
        <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-[#D9D2C5] shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#5A5A40] text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-8 h-8 text-[#8BA888]" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-[#3D3D2D]">Cổng Quản Trị & Giám Sát Riêng Biệt</h2>
            <p className="text-xs text-[#8A8A70]">
              Đăng nhập bằng tài khoản Quản trị viên / Phụ huynh để theo dõi kết quả học tập của <strong>Nguyễn Hoàng Hà</strong>
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = adminEmail.trim().toLowerCase();
              const adminAcc = usersList.find(
                (u) =>
                  (u.email.toLowerCase() === trimmed || u.id === trimmed || trimmed === 'admin') &&
                  u.role === 'admin'
              );
              if (adminAcc && adminAcc.password === adminPass) {
                switchUser(adminAcc.id);
                setAdminError(null);
              } else {
                setAdminError('Tài khoản hoặc mật khẩu quản trị không chính xác! (Gợi ý: admin / 123)');
              }
            }}
            className="space-y-3.5 text-left text-xs"
          >
            <div>
              <label className="block font-bold text-[#5A5A40] mb-1">Tài khoản Quản Trị:</label>
              <input
                type="text"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-medium text-[#3D3D2D]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#5A5A40] mb-1">Mật khẩu:</label>
              <input
                type="password"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                placeholder="123"
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden text-[#3D3D2D]"
                required
              />
            </div>

            {adminError && (
              <p className="text-red-600 font-bold text-[11px]">{adminError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-bold rounded-2xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Đăng nhập vào Dashboard Giám Sát</span>
            </button>
          </form>

          {/* 1-Click Fast Admin Switch */}
          <div className="pt-2 border-t border-[#F5F2ED] space-y-2">
            <p className="text-[11px] text-[#8A8A70]">Hoặc truy cập nhanh với tài khoản giám sát:</p>
            <button
              onClick={() => {
                const adminAcc = usersList.find((u) => u.role === 'admin');
                if (adminAcc) switchUser(adminAcc.id);
              }}
              className="w-full py-2.5 bg-[#FAF9F6] hover:bg-[#E8E2D9] border border-[#D9D2C5] text-[#5A5A40] rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-[#8BA888]" />
              <span>Đăng nhập 1-Chạm: Admin (Người Giám Sát)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 relative">
      {/* Real-time Live Toast Alert */}
      {liveToast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm bg-white rounded-2xl p-4 border-2 border-[#8BA888] shadow-2xl flex items-start space-x-3 animate-in slide-in-from-top duration-300">
          <div className="w-8 h-8 rounded-xl bg-[#8BA888]/20 flex items-center justify-center text-[#5A5A40] shrink-0 mt-0.5 animate-pulse">
            <Radio className="w-4 h-4 text-[#8BA888]" />
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.2 bg-[#8BA888] text-[#2C3E2D] text-[9px] font-bold rounded-full uppercase">
                ⚡ Realtime Pulse
              </span>
              <button onClick={() => setLiveToast(null)} className="text-[#8A8A70] hover:text-[#3D3D2D]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs font-bold text-[#3D3D2D] truncate">{liveToast.userName}: {liveToast.title}</p>
            <p className="text-[11px] text-[#6B6B54] line-clamp-2">{liveToast.detail}</p>
          </div>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="bg-[#5A5A40] text-white p-6 sm:p-8 rounded-[2rem] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
              <Radio className="w-3.5 h-3.5 text-[#8BA888] animate-pulse" />
              <span>Giám Sát Thời Gian Thực (Real-time Live Sync)</span>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-bold">
              ● Live 0ms
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Dashboard Giám Sát Quá Trình Học & Kiểm Soát Từ Xa
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D2C5] leading-relaxed">
            Cập nhật kết quả làm bài, câu sai và tiến độ học tập của em bạn thời gian thực không độ trễ. Hỗ trợ giao bài tập và gửi lời dặn dò trực tiếp từ xa.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setShowCloudModal(true)}
            className="px-3.5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Cài đặt mã phòng & đồng bộ Online DB"
          >
            <Database className="w-4 h-4 text-[#8BA888]" />
            <span>DB Online & Mã Phòng</span>
          </button>

          <button
            onClick={() => setShowAssignTaskModal(true)}
            className="px-4 py-2.5 bg-[#8BA888] hover:bg-[#789675] text-white rounded-2xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Giao bài từ xa cho em</span>
          </button>

          <button
            onClick={() => setShowAddStudentModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm học sinh</span>
          </button>
        </div>
      </div>

      {/* 2. Sibling Quick Live Spotlight Card */}
      {siblingStat && (
        <div className="bg-[#FAF9F6] p-5 sm:p-6 rounded-[2.5rem] border border-[#D9D2C5] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-2xl ${siblingStat.student.avatarColor || 'bg-[#5A5A40]'} text-white font-bold text-lg flex items-center justify-center shadow-sm`}
              >
                {siblingStat.student.name.charAt(0)}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.2 bg-[#5A5A40] text-white text-[10px] font-bold rounded-md uppercase">
                  Đang Giám Sát
                </span>
                <h3 className="font-bold text-[#3D3D2D] text-base">{siblingStat.student.name}</h3>
              </div>
              <p className="text-xs text-[#8A8A70]">
                Mục tiêu: <strong>{siblingStat.student.targetSchool}</strong> (Toán: {siblingStat.student.targetScoreMath}đ • Anh: {siblingStat.student.targetScoreEnglish}đ)
              </p>
            </div>
          </div>

          {/* Quick Metrics of Sibling */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A8A70] block">Dự đoán Toán</span>
              <strong className="text-base font-extrabold text-[#5A5A40]">{siblingStat.avgMath}đ</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A8A70] block">Dự đoán Anh</span>
              <strong className="text-base font-extrabold text-[#5A5A40]">{siblingStat.avgEng}đ</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A8A70] block">Đề thi đã làm</span>
              <strong className="text-base font-extrabold text-[#3D3D2D]">{siblingStat.totalAttemptsCount} bài</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A8A70] block">Câu sai chưa sửa</span>
              <strong className="text-base font-extrabold text-[#E67E22]">{siblingStat.activeMistakesCount} câu</strong>
            </div>

            <button
              onClick={() => handleOpenStudentDetail(siblingStat.student)}
              className="px-4 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer"
            >
              <span>Xem hồ sơ 360°</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex bg-[#E8E2D9] p-1.5 rounded-2xl max-w-2xl shadow-2xs text-xs font-bold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveAdminTab('overview')}
          className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            activeAdminTab === 'overview'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Tổng quan học tập</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('realtime_pulse')}
          className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            activeAdminTab === 'realtime_pulse'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <Activity className="w-4 h-4 text-[#8BA888]" />
          <span>Nhật ký Live Realtime ({realtimeEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('students')}
          className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            activeAdminTab === 'students'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh sách học sinh ({totalStudents})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('questions')}
          className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            activeAdminTab === 'questions'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Ngân hàng câu hỏi</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('exams')}
          className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            activeAdminTab === 'exams'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Đề thi tuyển sinh</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ⚡ TAB: REALTIME LIVE PULSE & SIMULATION TESTING                           */}
      {/* ========================================================================= */}
      {activeAdminTab === 'realtime_pulse' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Live Simulator Trigger Box */}
          <div className="bg-[#FDFCFB] p-5 sm:p-6 rounded-[2.5rem] border border-[#D9D2C5] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-[#E67E22]" />
                <h3 className="text-sm font-bold text-[#3D3D2D]">Trình Thử Nghiệm Kết Nối Real-time (Side-by-Side)</h3>
              </div>
              <span className="text-[11px] text-[#8A8A70]">Kích hoạt để kiểm tra truyền tin 0ms</span>
            </div>
            <p className="text-xs text-[#8A8A70]">
              Bạn có thể mở một tab phụ với tài khoản của em để làm bài, hoặc bấm các nút mô phỏng bên dưới để thấy thông số và bảng tin cập nhật tức thì:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => handleSimulateStudentExam(9.0)}
                className="px-3.5 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] border border-[#D9D2C5] rounded-xl text-xs font-bold text-[#5A5A40] transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <span>⚡ Em nộp bài thi thử Toán (9.0đ)</span>
              </button>

              <button
                onClick={() => handleSimulateStudentExam(8.5)}
                className="px-3.5 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] border border-[#D9D2C5] rounded-xl text-xs font-bold text-[#5A5A40] transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <span>⚡ Em nộp bài thi Tiếng Anh (8.5đ)</span>
              </button>

              <button
                onClick={handleSimulateStudentMistake}
                className="px-3.5 py-2 bg-[#FDF2E9] hover:bg-[#FCE6D2] border border-[#E67E22]/40 rounded-xl text-xs font-bold text-[#D35400] transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <span>⚠️ Em làm sai câu Vi-ét</span>
              </button>
            </div>
          </div>

          {/* Chronological Live Feed */}
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-[#EAE7E0] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-[#8BA888]" />
                <h3 className="text-base font-bold text-[#3D3D2D]">Dòng Hoạt Động Thời Gian Thực Của Học Sinh</h3>
              </div>
              <span className="text-xs text-[#8A8A70] font-medium">Tự động cập nhật không cần tải lại trang</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
              {realtimeEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] hover:border-[#D9D2C5] transition flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start space-x-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl ${evt.avatarColor || 'bg-[#5A5A40]'} text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      {evt.userName.charAt(0)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#3D3D2D]">{evt.userName}</span>
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                            evt.type === 'exam_submitted'
                              ? 'bg-[#EBF2EB] text-[#8BA888]'
                              : evt.type === 'question_wrong'
                              ? 'bg-[#FDF2E9] text-[#E67E22]'
                              : 'bg-[#F5F2ED] text-[#5A5A40]'
                          }`}
                        >
                          {evt.type === 'exam_submitted'
                            ? 'Nộp bài thi'
                            : evt.type === 'question_wrong'
                            ? 'Làm sai'
                            : 'Học tập'}
                        </span>
                      </div>
                      <p className="font-semibold text-[#5A5A40] leading-snug">{evt.title}</p>
                      <p className="text-[#6B6B54] leading-relaxed">{evt.detail}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-[#8A8A70] block font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString('vi-VN')}
                    </span>
                    {evt.score !== undefined && (
                      <span className="text-sm font-extrabold text-[#5A5A40] block mt-1">
                        {evt.score.toFixed(1)}đ
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 TAB: OVERVIEW                                                          */}
      {/* ========================================================================= */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* 5 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-[#8A8A70] text-[11px] font-bold uppercase">
                <Users className="w-4 h-4 text-[#5A5A40]" />
                <span>Sĩ số học sinh</span>
              </div>
              <div className="text-3xl font-extrabold text-[#5A5A40]">{totalStudents} em</div>
              <p className="text-[10px] text-[#8A8A70]">Lớp 9 Ôn thi Vào 10</p>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-[#8A8A70] text-[11px] font-bold uppercase">
                <span className="text-base">📐</span>
                <span>Điểm TB Môn Toán</span>
              </div>
              <div className="text-3xl font-extrabold text-[#5A5A40]">{classAvgMath}/10</div>
              <p className="text-[10px] text-[#8BA888] font-semibold">Tất cả đề thi thử Toán</p>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-[#8A8A70] text-[11px] font-bold uppercase">
                <span className="text-base">🇬🇧</span>
                <span>Điểm TB Môn Anh</span>
              </div>
              <div className="text-3xl font-extrabold text-[#5A5A40]">{classAvgEng}/10</div>
              <p className="text-[10px] text-[#8BA888] font-semibold">Tất cả đề thi thử Anh</p>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-[#8A8A70] text-[11px] font-bold uppercase">
                <Target className="w-4 h-4 text-[#8BA888]" />
                <span>Đạt Mục Tiêu NV1</span>
              </div>
              <div className="text-3xl font-extrabold text-[#8BA888]">{targetReachPercent}%</div>
              <p className="text-[10px] text-[#8A8A70]">{targetReachCount}/{totalStudents} học sinh vững vàng</p>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1 col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-1.5 text-[#8A8A70] text-[11px] font-bold uppercase">
                <AlertTriangle className="w-4 h-4 text-[#E67E22]" />
                <span>Câu sai cần chữa</span>
              </div>
              <div className="text-3xl font-extrabold text-[#E67E22]">{totalClassMistakes} câu</div>
              <p className="text-[10px] text-[#8A8A70]">{totalSubmissions} bài thi đã nộp</p>
            </div>
          </div>

          {/* 2-Column: Class Weakness Matrix & Grade Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Class Weakness Heatmap (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-6 border border-[#EAE7E0] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
                <div>
                  <h3 className="text-base font-bold text-[#3D3D2D]">
                    Ma Trận Báo Động Lỗ Hổng Kiến Thức
                  </h3>
                  <p className="text-xs text-[#8A8A70]">
                    Tỷ lệ chính xác bình quân của cả lớp theo từng dạng bài trọng tâm
                  </p>
                </div>
                <div className="flex space-x-1 bg-[#FAF9F6] p-1 rounded-xl border border-[#D9D2C5] text-[11px] font-bold">
                  <button
                    onClick={() => setSelectedSubjectFilter('all')}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      selectedSubjectFilter === 'all' ? 'bg-[#5A5A40] text-white' : 'text-[#6B6B54]'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setSelectedSubjectFilter('math')}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      selectedSubjectFilter === 'math' ? 'bg-[#5A5A40] text-white' : 'text-[#6B6B54]'
                    }`}
                  >
                    Toán
                  </button>
                  <button
                    onClick={() => setSelectedSubjectFilter('english')}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      selectedSubjectFilter === 'english' ? 'bg-[#5A5A40] text-white' : 'text-[#6B6B54]'
                    }`}
                  >
                    Tiếng Anh
                  </button>
                </div>
              </div>

              {/* Topics Grid */}
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
                {(selectedSubjectFilter === 'all' || selectedSubjectFilter === 'math') && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-[#5A5A40] uppercase tracking-wider block">
                      📐 Chuyên đề Môn Toán 9 Vào 10:
                    </span>
                    {MATH_TOPICS_META.slice(0, 5).map((t, idx) => {
                      const mockAcc = idx === 0 ? 90 : idx === 1 ? 85 : idx === 3 ? 68 : idx === 4 ? 72 : 62;
                      const isDanger = mockAcc < 70;
                      return (
                        <div
                          key={t.id}
                          className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1 pr-3">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                isDanger ? 'bg-[#E67E22] animate-ping' : 'bg-[#8BA888]'
                              }`}
                            />
                            <span className="font-bold text-[#3D3D2D] truncate">{t.nameVi}</span>
                          </div>
                          <div className="flex items-center space-x-3 shrink-0">
                            <div className="w-24 bg-[#E8E2D9] h-2 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${isDanger ? 'bg-[#E67E22]' : 'bg-[#8BA888]'}`}
                                style={{ width: `${mockAcc}%` }}
                              />
                            </div>
                            <span className={`font-extrabold ${isDanger ? 'text-[#E67E22]' : 'text-[#5A5A40]'}`}>
                              {mockAcc}% {isDanger && '⚠️ Cần ôn'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {(selectedSubjectFilter === 'all' || selectedSubjectFilter === 'english') && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-[#5A5A40] uppercase tracking-wider block">
                      🇬🇧 Chuyên đề Môn Tiếng Anh 9 Vào 10:
                    </span>
                    {TOPICS_META.slice(0, 5).map((t, idx) => {
                      const mockAcc = idx === 0 ? 88 : idx === 1 ? 82 : idx === 4 ? 65 : idx === 5 ? 69 : 78;
                      const isDanger = mockAcc < 70;
                      return (
                        <div
                          key={t.id}
                          className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1 pr-3">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                isDanger ? 'bg-[#E67E22] animate-ping' : 'bg-[#8BA888]'
                              }`}
                            />
                            <span className="font-bold text-[#3D3D2D] truncate">{t.nameVi}</span>
                          </div>
                          <div className="flex items-center space-x-3 shrink-0">
                            <div className="w-24 bg-[#E8E2D9] h-2 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${isDanger ? 'bg-[#E67E22]' : 'bg-[#8BA888]'}`}
                                style={{ width: `${mockAcc}%` }}
                              />
                            </div>
                            <span className={`font-extrabold ${isDanger ? 'text-[#E67E22]' : 'text-[#5A5A40]'}`}>
                              {mockAcc}% {isDanger && '⚠️ Cần ôn'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Grade Tier Distribution & Top Students (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Grade Tier Chart */}
              <div className="bg-white rounded-[2.5rem] p-6 border border-[#EAE7E0] shadow-xs space-y-3.5">
                <h3 className="text-base font-bold text-[#3D3D2D]">Phổ Điểm Tuyển Sinh Cả Lớp</h3>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between font-bold text-[#3D3D2D] mb-1">
                      <span className="text-emerald-700">Xuất sắc (9.0 - 10.0)</span>
                      <span>2 em (40%)</span>
                    </div>
                    <div className="w-full bg-[#FAF9F6] h-2 rounded-full border border-[#EAE7E0] overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-[#3D3D2D] mb-1">
                      <span className="text-[#5A5A40]">Giỏi (8.0 - 8.9)</span>
                      <span>2 em (40%)</span>
                    </div>
                    <div className="w-full bg-[#FAF9F6] h-2 rounded-full border border-[#EAE7E0] overflow-hidden">
                      <div className="bg-[#5A5A40] h-full rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-[#3D3D2D] mb-1">
                      <span className="text-[#E67E22]">Khá (6.5 - 7.9)</span>
                      <span>1 em (20%)</span>
                    </div>
                    <div className="w-full bg-[#FAF9F6] h-2 rounded-full border border-[#EAE7E0] overflow-hidden">
                      <div className="bg-[#E67E22] h-full rounded-full" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performer Highlights */}
              <div className="bg-[#FAF9F6] rounded-[2.5rem] p-6 border border-[#D9D2C5] space-y-3">
                <div className="flex items-center space-x-2 text-[#5A5A40] font-bold text-sm">
                  <Award className="w-4 h-4 text-[#8BA888]" />
                  <span>Học sinh tiêu biểu & Chăm chỉ nhất</span>
                </div>

                <div className="space-y-2">
                  {allStudentStats.slice(0, 3).map(({ student, avgMath, avgEng }) => (
                    <div
                      key={student.id}
                      onClick={() => handleOpenStudentDetail(student)}
                      className="p-3 bg-white rounded-2xl border border-[#EAE7E0] hover:border-[#5A5A40] transition cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl ${student.avatarColor || 'bg-[#5A5A40]'} text-white font-bold text-xs flex items-center justify-center`}
                        >
                          {student.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#3D3D2D] truncate">{student.name}</p>
                          <p className="text-[10px] text-[#8A8A70] truncate">{student.targetSchool}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-[#5A5A40]">
                          T: {avgMath} • A: {avgEng}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👥 TAB: STUDENT ROSTER                                                    */}
      {/* ========================================================================= */}
      {activeAdminTab === 'students' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-[2rem] border border-[#EAE7E0] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[260px] relative">
              <Search className="w-4 h-4 text-[#8A8A70] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchStudentQuery}
                onChange={(e) => setSearchStudentQuery(e.target.value)}
                placeholder="Tìm kiếm theo họ tên, email, trường THPT mục tiêu..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:ring-1 focus:ring-[#5A5A40]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#8A8A70]">
                Hiển thị <strong>{filteredStudents.length}</strong> / {totalStudents} học sinh
              </span>

              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-3.5 py-1.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm học sinh</span>
              </button>
            </div>
          </div>

          {/* Student Cards Roster Table */}
          <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF9F6] text-[#8A8A70] uppercase font-bold border-b border-[#EAE7E0]">
                  <tr>
                    <th className="p-3.5">Học sinh Lớp 9</th>
                    <th className="p-3.5">Trường NV1</th>
                    <th className="p-3.5 text-center">Dự đoán Toán</th>
                    <th className="p-3.5 text-center">Dự đoán Anh</th>
                    <th className="p-3.5 text-center">Đề đã làm</th>
                    <th className="p-3.5 text-center">Câu sai tồn</th>
                    <th className="p-3.5 text-center">Chuỗi ngày</th>
                    <th className="p-3.5 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F2ED]">
                  {filteredStudents.map(({ student, avgMath, avgEng, totalAttemptsCount, activeMistakesCount }) => {
                    const isLocked = student.isLocked;
                    return (
                      <tr key={student.id} className="hover:bg-[#FAF9F6] transition">
                        <td className="p-3.5">
                          <div className="flex items-center space-x-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl ${student.avatarColor || 'bg-[#5A5A40]'} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                            >
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-[#3D3D2D] leading-snug">{student.name}</p>
                              <p className="text-[10px] text-[#8A8A70]">{student.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-[#4A4A4A] font-medium max-w-[160px] truncate">
                          {student.targetSchool || 'THPT Chu Văn An'}
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="font-bold text-sm text-[#5A5A40]">{avgMath}</span>
                          <span className="text-[10px] text-[#8A8A70] block">/ {student.targetScoreMath || 8.5}đ</span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="font-bold text-sm text-[#5A5A40]">{avgEng}</span>
                          <span className="text-[10px] text-[#8A8A70] block">/ {student.targetScoreEnglish || 8.5}đ</span>
                        </td>

                        <td className="p-3.5 text-center font-bold text-[#3D3D2D]">
                          {totalAttemptsCount} bài
                        </td>

                        <td className="p-3.5 text-center">
                          {activeMistakesCount > 0 ? (
                            <span className="px-2 py-0.5 bg-[#FDF2E9] text-[#E67E22] font-bold rounded-md">
                              {activeMistakesCount} câu
                            </span>
                          ) : (
                            <span className="text-[#8BA888] font-bold">0</span>
                          )}
                        </td>

                        <td className="p-3.5 text-center font-bold text-[#E67E22]">
                          🔥 {student.streakDays || 1} ngày
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenStudentDetail(student)}
                              className="px-2.5 py-1 bg-[#5A5A40] text-white hover:bg-[#3D3D2D] rounded-xl text-[11px] font-bold shadow-2xs transition cursor-pointer"
                              title="Xem chi tiết 360 độ"
                            >
                              Chi tiết
                            </button>

                            <button
                              onClick={() => {
                                switchUser(student.id);
                              }}
                              className="p-1.5 bg-[#FAF9F6] border border-[#D9D2C5] text-[#5A5A40] hover:bg-[#E8E2D9] rounded-xl text-[11px] font-bold transition cursor-pointer"
                              title="Chuyển sang đăng nhập tài khoản học sinh này"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => toggleUserLock(student.id)}
                              className="p-1.5 text-[#8A8A70] hover:text-[#C0392B] rounded-xl transition cursor-pointer"
                              title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            >
                              {isLocked ? <Lock className="w-3.5 h-3.5 text-red-500" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📚 TAB: QUESTIONS BANK                                                    */}
      {/* ========================================================================= */}
      {activeAdminTab === 'questions' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white p-4 rounded-[2rem] border border-[#EAE7E0] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 items-center space-x-3 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8A8A70] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuestionQuery}
                  onChange={(e) => setSearchQuestionQuery(e.target.value)}
                  placeholder="Tìm nội dung câu hỏi, đáp án, giải thích..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:ring-1 focus:ring-[#5A5A40]"
                />
              </div>

              <select
                value={selectedQuestionTopic}
                onChange={(e) => setSelectedQuestionTopic(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl text-[#4A4A4A] outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả chuyên đề ({questions.length})</option>
                <optgroup label="📐 Môn Toán">
                  {MATH_TOPICS_META.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameVi}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇬🇧 Môn Tiếng Anh">
                  {TOPICS_META.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameVi}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingQ(null);
                setQSubject('math');
                setTopicId('math_can_thuc');
                setContent('');
                setOpt0('A. ');
                setOpt1('B. ');
                setOpt2('C. ');
                setOpt3('D. ');
                setCorrectOption(0);
                setExplanation('');
                setShowQModal(true);
              }}
              className="px-4 py-2 bg-[#8BA888] hover:bg-[#789675] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm câu hỏi mới</span>
            </button>
          </div>

          {/* Question List */}
          <div className="space-y-3">
            {questions
              .filter((q) => {
                if (selectedQuestionTopic !== 'all' && q.topicId !== selectedQuestionTopic) return false;
                if (
                  searchQuestionQuery &&
                  !q.content.toLowerCase().includes(searchQuestionQuery.toLowerCase()) &&
                  !q.explanation.toLowerCase().includes(searchQuestionQuery.toLowerCase())
                ) {
                  return false;
                }
                return true;
              })
              .map((q, idx) => (
                <div
                  key={q.id}
                  className="p-5 bg-white rounded-[2rem] border border-[#EAE7E0] shadow-sm hover:border-[#D9D2C5] transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-[#F5F2ED] text-[#5A5A40] text-xs font-bold rounded-lg border border-[#D9D2C5]">
                        #{idx + 1} • {q.subject === 'math' ? '📐 Toán' : '🇬🇧 Anh'} • {q.topicId.replace('math_', '').replace(/_/g, ' ')}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#F5F2ED] text-[#6B6B54] uppercase">
                        {q.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingQ(q);
                          setQSubject(q.subject || 'english');
                          setTopicId(q.topicId);
                          setContent(q.content);
                          setOpt0(q.options[0] || '');
                          setOpt1(q.options[1] || '');
                          setOpt2(q.options[2] || '');
                          setOpt3(q.options[3] || '');
                          setCorrectOption(q.correctOption);
                          setExplanation(q.explanation);
                          setShowQModal(true);
                        }}
                        className="p-1.5 text-[#8A8A70] hover:text-[#5A5A40] rounded-lg hover:bg-[#FAF9F6] transition cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) deleteQuestion(q.id);
                        }}
                        className="p-1.5 text-[#8A8A70] hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm font-bold text-[#3D3D2D] whitespace-pre-line">{q.content}</div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-xl border whitespace-pre-line ${
                          oIdx === q.correctOption
                            ? 'bg-[#EBF2EB] border-[#8BA888] text-[#3D3D2D] font-bold'
                            : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#6B6B54]'
                        }`}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-[#8A8A70] pt-1 whitespace-pre-line">
                    <strong>Lời giải:</strong> {q.explanation}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎓 TAB: EXAMS LIST                                                        */}
      {/* ========================================================================= */}
      {activeAdminTab === 'exams' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-[#EAE7E0] shadow-sm">
            <h3 className="text-sm font-bold text-[#3D3D2D]">Danh sách Đề thi Tuyển sinh ({exams.length})</h3>
            <button
              onClick={() => {
                setSelectedQIds(questions.slice(0, 12).map((q) => q.id));
                setShowExamModal(true);
              }}
              className="px-4 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đề thi mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((ex) => (
              <div
                key={ex.id}
                className="bg-white p-6 rounded-[2.5rem] border border-[#EAE7E0] shadow-sm space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-1 bg-[#F5F2ED] text-[#5A5A40] font-bold text-xs rounded-xl border border-[#D9D2C5]">
                    {ex.subject === 'math' ? '📐 Toán' : '🇬🇧 Anh'} • {ex.code}
                  </span>
                  <span className="text-xs text-[#8A8A70]">{ex.timeLimitMinutes} phút</span>
                </div>

                <h4 className="font-bold text-base text-[#3D3D2D]">{ex.title}</h4>
                <p className="text-xs text-[#8A8A70] line-clamp-2">{ex.description}</p>

                <div className="pt-3 border-t border-[#F5F2ED] flex justify-between items-center text-xs">
                  <span className="text-[#8A8A70]">
                    Số câu: <strong>{ex.questionIds.length} câu</strong>
                  </span>
                  <button
                    onClick={() => {
                      if (confirm('Xóa đề thi này khỏi hệ thống?')) deleteExam(ex.id);
                    }}
                    className="text-red-500 hover:underline text-xs font-semibold cursor-pointer"
                  >
                    Xóa đề
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 MODAL: REMOTE TASK ASSIGNMENT (GIAO NHIỆM VỤ CHO EM TỪ XA)            */}
      {/* ========================================================================= */}
      {showAssignTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#8BA888]/20 flex items-center justify-center text-[#5A5A40]">
                  <Send className="w-4 h-4 text-[#8BA888]" />
                </div>
                <h3 className="font-bold text-[#3D3D2D] text-base">Giao Bài Tập & Nhắc Nhở Từ Xa</h3>
              </div>
              <button
                onClick={() => setShowAssignTaskModal(false)}
                className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendRemoteTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Giao cho ai:</label>
                <select
                  value={taskTargetStudentId}
                  onChange={(e) => setTaskTargetStudentId(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-bold text-[#3D3D2D]"
                >
                  {studentUsers.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.targetSchool})
                    </option>
                  ))}
                  <option value="all">📢 Tất cả học sinh trong lớp</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Môn học:</label>
                  <select
                    value={taskSubject}
                    onChange={(e) => {
                      const s = e.target.value as SubjectId;
                      setTaskSubject(s);
                      setTaskAssignedExamId(s === 'math' ? 'math_exam_official_01' : 'exam_official_01');
                    }}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-bold"
                  >
                    <option value="math">📐 Môn Toán</option>
                    <option value="english">🇬🇧 Môn Tiếng Anh</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Chỉ định đề thi:</label>
                  <select
                    value={taskAssignedExamId}
                    onChange={(e) => {
                      setTaskAssignedExamId(e.target.value);
                      const found = exams.find((x) => x.id === e.target.value);
                      if (found) setTaskTitle(found.title);
                    }}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  >
                    {exams
                      .filter((ex) => (ex.subject || 'english') === taskSubject)
                      .map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.code} - {ex.title.slice(0, 24)}...
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Tiêu đề nhiệm vụ:</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Lời nhắn & Dặn dò của bạn:</label>
                <textarea
                  rows={2}
                  value={taskMessage}
                  onChange={(e) => setTaskMessage(e.target.value)}
                  placeholder="Ví dụ: Em nhớ căn giờ 60 phút và làm kỹ bài hình tứ giác nội tiếp nhé!"
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden text-[#3D3D2D]"
                  required
                />
              </div>

              {taskSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đã phát sóng nhiệm vụ thời gian thực đến học sinh!</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#F5F2ED]">
                <button
                  type="button"
                  onClick={() => setShowAssignTaskModal(false)}
                  className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#6B6B54] rounded-xl font-bold transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi nhiệm vụ ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 MODAL: STUDENT 360° DETAILED PERFORMANCE INSPECTOR                     */}
      {/* ========================================================================= */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] max-h-[92vh] overflow-y-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#F5F2ED] gap-3">
              <div className="flex items-center space-x-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl ${selectedStudentForDetail.avatarColor || 'bg-[#5A5A40]'} text-white font-bold text-lg flex items-center justify-center shadow-md`}
                >
                  {selectedStudentForDetail.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-[#3D3D2D]">{selectedStudentForDetail.name}</h3>
                    <span className="px-2.5 py-0.5 bg-[#F5F2ED] text-[#5A5A40] rounded-lg text-[11px] font-bold">
                      Học sinh Lớp 9
                    </span>
                  </div>
                  <p className="text-xs text-[#8A8A70]">
                    {selectedStudentForDetail.email} • Nguyện vọng 1: <strong>{selectedStudentForDetail.targetSchool}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    switchUser(selectedStudentForDetail.id);
                    setSelectedStudentForDetail(null);
                  }}
                  className="px-3.5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Đăng nhập tư cách học sinh này</span>
                </button>

                <button
                  onClick={() => setSelectedStudentForDetail(null)}
                  className="p-1.5 text-[#8A8A70] hover:text-[#3D3D2D] rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Student Quick Scores Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF9F6] p-4 rounded-2xl border border-[#D9D2C5]">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Mục tiêu Môn Toán</span>
                <p className="text-lg font-extrabold text-[#5A5A40]">
                  {selectedStudentForDetail.targetScoreMath || 8.5}/10
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Mục tiêu Tiếng Anh</span>
                <p className="text-lg font-extrabold text-[#5A5A40]">
                  {selectedStudentForDetail.targetScoreEnglish || 8.5}/10
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Chuỗi ngày chuyên cần</span>
                <p className="text-lg font-extrabold text-[#E67E22]">
                  🔥 {selectedStudentForDetail.streakDays || 1} ngày
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Trạng thái tài khoản</span>
                <p className="text-sm font-bold text-[#8BA888]">
                  {selectedStudentForDetail.isLocked ? '🔒 Đang khóa' : '✓ Hoạt động'}
                </p>
              </div>
            </div>

            {/* Exam Attempts History for this student */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#3D3D2D] flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-[#5A5A40]" />
                <span>Lịch Sử Bài Thi Thử Đã Hoàn Thành:</span>
              </h4>

              {getUserScopedData(selectedStudentForDetail.id).examAttempts.length === 0 ? (
                <div className="p-6 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] text-center text-xs text-[#8A8A70]">
                  Học sinh chưa hoàn thành bài thi thử nào.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                  {getUserScopedData(selectedStudentForDetail.id).examAttempts.map((att, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#3D3D2D]">{att.examTitle}</span>
                          <span className="px-2 py-0.2 bg-white rounded text-[10px] font-bold text-[#5A5A40] border border-[#D9D2C5]">
                            {att.subject === 'math' ? '📐 Môn Toán' : '🇬🇧 Môn Tiếng Anh'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8A8A70]">
                          Thời gian: {Math.round((att.timeSpentSeconds || 1800) / 60)} phút • Ngày {new Date(att.date).toLocaleDateString('vi-VN')}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-extrabold text-[#5A5A40]">{att.score.toFixed(2)}đ</span>
                        <span className="text-[10px] text-[#8BA888] block font-semibold">
                          {att.correctCount}/{att.totalQuestions} câu đúng
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Mistakes for this student */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#3D3D2D] flex items-center space-x-2">
                <BookMarked className="w-4 h-4 text-[#E67E22]" />
                <span>Sổ Câu Sai Cần Bồi Dưỡng Của Học Sinh:</span>
              </h4>

              {Object.keys(getUserScopedData(selectedStudentForDetail.id).mistakes || {}).length === 0 ? (
                <div className="p-4 bg-[#EBF2EB] rounded-2xl border border-[#8BA888]/30 text-center text-xs text-emerald-800 font-medium">
                  Không có câu sai tồn đọng! Học sinh đã nắm chắc kiến thức.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                  {Object.values(getUserScopedData(selectedStudentForDetail.id).mistakes || {}).map((m, idx) => (
                    <div key={idx} className="p-3 bg-[#FAF9F6] rounded-xl border border-[#EAE7E0] space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-0.5 bg-[#FDF2E9] text-[#E67E22] font-bold rounded text-[10px]">
                          Sai {m.wrongCount} lần
                        </span>
                        <span className="text-[10px] text-[#8A8A70] uppercase font-bold">
                          {m.subject === 'math' ? 'Toán' : 'Anh'}
                        </span>
                      </div>
                      <p className="text-[#3D3D2D] font-medium line-clamp-2">
                        Mã câu hỏi: <code className="font-mono text-[11px]">{m.questionId}</code>
                      </p>
                      {m.userNote && (
                        <p className="text-[11px] text-[#5A5A40] italic bg-white p-1.5 rounded border border-[#EAE7E0]">
                          💡 {m.userNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Teacher Feedback / Pedagogical Note Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#5A5A40]/10 border border-[#5A5A40]/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-[#5A5A40] font-bold text-xs">
                  <MessageSquare className="w-4 h-4" />
                  <span>Lời dặn dò & Nhận xét của Giáo viên dành cho em {selectedStudentForDetail.name}:</span>
                </div>
                {teacherNoteSaved && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã lưu nhận xét!</span>
                  </span>
                )}
              </div>

              <textarea
                rows={2}
                value={teacherNoteInput}
                onChange={(e) => setTeacherNoteInput(e.target.value)}
                placeholder="Ví dụ: Em cần chú ý hơn dạng toán Vi-ét đối xứng và câu bị động kép. Tối nay hoàn thành 1 đề tốc độ nhé!"
                className="w-full p-3 bg-white border border-[#D9D2C5] rounded-xl text-xs text-[#3D3D2D] outline-hidden focus:border-[#5A5A40]"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleSaveTeacherNote}
                  className="px-4 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu nhận xét sư phạm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ➕ MODAL: ADD NEW STUDENT */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#8BA888]/20 flex items-center justify-center text-[#5A5A40]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#3D3D2D] text-base">Thêm Học Sinh Mới</h3>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newStudentName.trim() || !newStudentEmail.trim()) {
                  setAddStudentMsg('Vui lòng điền đầy đủ tên và email.');
                  return;
                }
                const res = register({
                  name: newStudentName.trim(),
                  email: newStudentEmail.trim().toLowerCase(),
                  password: newStudentPassword.trim() || '123',
                  targetSchool: newStudentSchool.trim(),
                  targetScoreMath: newStudentTargetMath,
                  targetScoreEnglish: newStudentTargetEng,
                  targetScore: parseFloat(((newStudentTargetMath + newStudentTargetEng) / 2).toFixed(2)),
                });
                if (res.success) {
                  setShowAddStudentModal(false);
                  setNewStudentName('');
                  setNewStudentEmail('');
                  setAddStudentMsg(null);
                } else {
                  setAddStudentMsg(res.message || 'Lỗi khi tạo học sinh');
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Họ và tên học sinh (*):</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Minh Tuấn"
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Email đăng nhập (*):</label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="minhtuan.lop9@gmail.com"
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Mật khẩu ban đầu:</label>
                <input
                  type="text"
                  value={newStudentPassword}
                  onChange={(e) => setNewStudentPassword(e.target.value)}
                  placeholder="Mặc định: 123"
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Trường THPT Nguyện vọng 1:</label>
                <input
                  type="text"
                  value={newStudentSchool}
                  onChange={(e) => setNewStudentSchool(e.target.value)}
                  placeholder="THPT Chu Văn An / THPT Kim Liên"
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Mục tiêu Môn Toán:</label>
                  <input
                    type="number"
                    step="0.25"
                    min="5"
                    max="10"
                    value={newStudentTargetMath}
                    onChange={(e) => setNewStudentTargetMath(parseFloat(e.target.value) || 8.5)}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Mục tiêu Tiếng Anh:</label>
                  <input
                    type="number"
                    step="0.25"
                    min="5"
                    max="10"
                    value={newStudentTargetEng}
                    onChange={(e) => setNewStudentTargetEng(parseFloat(e.target.value) || 8.5)}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40]"
                  />
                </div>
              </div>

              {addStudentMsg && (
                <p className="text-red-600 font-medium text-[11px]">{addStudentMsg}</p>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#F5F2ED]">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#6B6B54] rounded-xl font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                >
                  Tạo học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT QUESTION MODAL */}
      {showQModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <h3 className="font-bold text-[#3D3D2D] text-base">
                {editingQ ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}
              </h3>
              <button
                onClick={() => setShowQModal(false)}
                className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const qData = {
                  subject: qSubject,
                  topicId,
                  subTopicId,
                  difficulty,
                  content,
                  passage: passage.trim() ? passage : undefined,
                  options: [opt0, opt1, opt2, opt3],
                  correctOption,
                  explanation,
                  grammarRule: grammarRule.trim() ? grammarRule : undefined,
                  commonMistakeTip: commonMistakeTip.trim() ? commonMistakeTip : undefined,
                };
                if (editingQ) {
                  updateQuestion(editingQ.id, qData);
                } else {
                  addQuestion(qData);
                }
                setShowQModal(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#4A4A4A] mb-1">Môn học:</label>
                  <select
                    value={qSubject}
                    onChange={(e) => {
                      const s = e.target.value as SubjectId;
                      setQSubject(s);
                      setTopicId(s === 'math' ? 'math_can_thuc' : 'grammar');
                    }}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  >
                    <option value="math">📐 Môn Toán</option>
                    <option value="english">🇬🇧 Môn Tiếng Anh</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4A4A4A] mb-1">Chuyên đề:</label>
                  <select
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value as TopicId)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  >
                    {(qSubject === 'math' ? MATH_TOPICS_META : TOPICS_META).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameVi}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4A4A4A] mb-1">Độ khó:</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  >
                    <option value="easy">Nhận biết (Dễ)</option>
                    <option value="medium">Thông hiểu (Vừa)</option>
                    <option value="hard">Vận dụng (Khó)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">
                  Nội dung câu hỏi / Đề bài (*):
                </label>
                <textarea
                  rows={2}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-[#4A4A4A]">4 Phương án lựa chọn:</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={opt0}
                    onChange={(e) => setOpt0(e.target.value)}
                    className="p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                    required
                  />
                  <input
                    type="text"
                    value={opt1}
                    onChange={(e) => setOpt1(e.target.value)}
                    className="p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                    required
                  />
                  <input
                    type="text"
                    value={opt2}
                    onChange={(e) => setOpt2(e.target.value)}
                    className="p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                    required
                  />
                  <input
                    type="text"
                    value={opt3}
                    onChange={(e) => setOpt3(e.target.value)}
                    className="p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">Đáp án đúng:</label>
                <select
                  value={correctOption}
                  onChange={(e) => setCorrectOption(parseInt(e.target.value))}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                >
                  <option value={0}>Đáp án A</option>
                  <option value={1}>Đáp án B</option>
                  <option value={2}>Đáp án C</option>
                  <option value={3}>Đáp án D</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">
                  Lời giải chi tiết & Phương pháp giải (*):
                </label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowQModal(false)}
                  className="px-4 py-2 bg-[#FAF9F6] text-[#4A4A4A] rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A5A40] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Lưu câu hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EXAM MODAL */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 shadow-2xl border border-[#EAE7E0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <h3 className="font-bold text-[#3D3D2D] text-base">Tạo Đề Thi Tuyển Sinh Mới</h3>
              <button
                onClick={() => setShowExamModal(false)}
                className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addExam({
                  subject: examSubject,
                  title: examTitle,
                  code: examCode,
                  description: examDesc,
                  targetProvince: 'Toàn quốc',
                  timeLimitMinutes: examTime,
                  totalQuestions: selectedQIds.length,
                  difficulty: 'standard',
                  questionIds: selectedQIds.length > 0 ? selectedQIds : questions.slice(0, 10).map((q) => q.id),
                  isOfficialFormat: true,
                });
                setShowExamModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#4A4A4A] mb-1">Môn thi:</label>
                  <select
                    value={examSubject}
                    onChange={(e) => setExamSubject(e.target.value as SubjectId)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  >
                    <option value="math">📐 Toán Học</option>
                    <option value="english">🇬🇧 Tiếng Anh</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#4A4A4A] mb-1">Mã đề:</label>
                  <input
                    type="text"
                    value={examCode}
                    onChange={(e) => setExamCode(e.target.value)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">Tên đề thi:</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Ví dụ: Đề thi thử Sở GD&ĐT Hà Nội - Đợt 2"
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">Mô tả cấu trúc:</label>
                <textarea
                  rows={2}
                  value={examDesc}
                  onChange={(e) => setExamDesc(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-2 bg-[#FAF9F6] text-[#4A4A4A] rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A5A40] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Tạo đề thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Cloud DB & Room Key Modal */}
      <CloudSyncModal
        isOpen={showCloudModal}
        onClose={() => setShowCloudModal(false)}
      />
    </div>
  );
};
