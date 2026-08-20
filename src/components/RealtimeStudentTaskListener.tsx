import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RemoteTaskAssignment } from '../types';
import {
  subscribeToRemoteTasks,
  markRemoteTaskCompleted,
} from '../services/realtimeSyncService';
import { Bell, Sparkles, ArrowRight, X, GraduationCap, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RealtimeStudentTaskListenerProps {
  onStartExam?: (examId: string) => void;
  onPracticeTopic?: (topicId: string) => void;
}

export const RealtimeStudentTaskListener: React.FC<RealtimeStudentTaskListenerProps> = ({
  onStartExam,
  onPracticeTopic,
}) => {
  const { currentUser, switchSubject } = useApp();
  const [activeTask, setActiveTask] = useState<RemoteTaskAssignment | null>(null);
  const [dismissedTaskIds, setDismissedTaskIds] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToRemoteTasks((task) => {
      // Check if task is meant for this student or for 'all'
      if (
        (task.recipientUserId === 'all' || task.recipientUserId === currentUser.id) &&
        currentUser.role === 'student'
      ) {
        setActiveTask(task);
        try {
          // Play notification chime
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
          // Audio autoplay block
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!activeTask || dismissedTaskIds.includes(activeTask.id)) {
    return null;
  }

  const handleDismiss = () => {
    setDismissedTaskIds((prev) => [...prev, activeTask.id]);
    setActiveTask(null);
  };

  const handleAcceptTask = () => {
    if (activeTask.subject) {
      switchSubject(activeTask.subject);
    }
    markRemoteTaskCompleted(activeTask.id);
    handleDismiss();

    if (activeTask.assignedExamId && onStartExam) {
      onStartExam(activeTask.assignedExamId);
    } else if (activeTask.assignedTopicId && onPracticeTopic) {
      onPracticeTopic(activeTask.assignedTopicId);
    }
  };

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 max-w-sm w-full bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#5A5A40] shadow-2xl space-y-3 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-[#8BA888]/20 flex items-center justify-center text-[#5A5A40] animate-bounce">
            <Bell className="w-4 h-4 text-[#E67E22]" />
          </div>
          <div>
            <span className="px-2 py-0.5 bg-[#5A5A40] text-white font-bold text-[10px] rounded-md uppercase">
              Nhiệm vụ Real-time mới
            </span>
            <p className="text-xs font-bold text-[#3D3D2D] mt-0.5">{activeTask.senderName} vừa giao nhiệm vụ:</p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#D9D2C5] space-y-1 text-xs">
        <p className="font-bold text-[#5A5A40] flex items-center space-x-1.5">
          <GraduationCap className="w-4 h-4 text-[#8BA888]" />
          <span>{activeTask.title}</span>
        </p>
        <p className="text-[#4A4A4A] leading-relaxed text-[11px] italic">
          "{activeTask.message}"
        </p>
      </div>

      <div className="flex space-x-2 pt-1">
        <button
          onClick={handleDismiss}
          className="flex-1 py-2 text-xs font-bold text-[#6B6B54] bg-[#FAF9F6] hover:bg-[#E8E2D9] rounded-xl transition cursor-pointer"
        >
          Để sau
        </button>
        <button
          onClick={handleAcceptTask}
          className="flex-1 py-2 text-xs font-bold text-white bg-[#5A5A40] hover:bg-[#3D3D2D] rounded-xl shadow-xs transition flex items-center justify-center space-x-1 cursor-pointer"
        >
          <span>Làm ngay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
