import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Category = {
  id: string;
  title: string;
  icon: string; // Ionicons name
};

export type HabitTemplate = {
  id: string;
  categoryId: string;
  title: string;
  difficulty: Difficulty;
  program: { type: 'daily' | 'weekly'; schedule: Record<string, string[]> }; // e.g., { Mon: ['08:00'], ... } or daily: { '*': ['08:00','12:00'] }
};

export type Habit = {
  id: string;
  templateId: string;
  title: string;
  difficulty: Difficulty;
  categoryId: string;
  status: 'in-progress' | 'acquired';
  createdAt: string; // ISO
  progress: Record<string, boolean>; // dateISO => done (legacy)
  slotProgress?: Record<string, Record<string, boolean>>; // dateISO => time => done
  program: HabitTemplate['program'];
};

export type PomodoroSession = {
  id: string;
  startedAt: string; // ISO
  endedAt: string; // ISO
  durationSec: number;
  mode: 'work' | 'break';
};

export type Settings = {
  themeName: 'Dark' | 'Midnight' | 'Nord';
  pomodoro: {
    workSec: number;
    breakSec: number;
    longBreakSec: number;
    cycleLen: number; // kaç çalışma sonrası uzun mola
    autoSwitch: boolean;
    defaultUI: 'focus' | 'normal';
  };
  keepAwakeDuringPomodoro: boolean;
  habitRemindersEnabled: boolean;
  notifyOnPomodoroEnd: boolean;
  weekStartsOn: 'sunday' | 'monday';
};

type AppState = {
  settings: Settings;
  categories: Category[];
  templates: HabitTemplate[];
  habits: Habit[];
  pomodoroSessions: PomodoroSession[];

  // settings
  setThemeName: (name: Settings['themeName']) => void;
  setPomodoroDefaults: (p: Partial<Settings['pomodoro']>) => void;
  setKeepAwakeDuringPomodoro: (v: boolean) => void;
  setHabitRemindersEnabled: (v: boolean) => void;
  setNotifyOnPomodoroEnd: (v: boolean) => void;
  setWeekStartsOn: (v: Settings['weekStartsOn']) => void;

  // habits
  acquireHabit: (templateId: string) => Habit;
  markHabitToday: (habitId: string, done: boolean) => void;
  toggleHabitSlot: (habitId: string, dateISO: string, time: string, done: boolean) => void;
  setHabitStatus: (habitId: string, status: Habit['status']) => void;
  updateHabitTitle: (habitId: string, title: string) => void;
  updateHabitProgram: (habitId: string, program: HabitTemplate['program']) => void;

  // pomodoro sessions
  addPomodoroSession: (s: PomodoroSession) => void;

  // notifications
  habitNotificationIds?: string[];
  setHabitNotificationIds: (ids: string[]) => void;
};

const todayISO = () => dayjs().format('YYYY-MM-DD');

const initialCategories: Category[] = [
  { id: 'health', title: 'Sağlık', icon: 'heart-outline' },
  { id: 'productivity', title: 'Verimlilik', icon: 'checkmark-done-outline' },
  { id: 'mind', title: 'Zihin', icon: 'book-outline' },
  { id: 'social', title: 'Sosyal', icon: 'people-outline' },
  { id: 'learning', title: 'Öğrenme', icon: 'school-outline' },
];

const initialTemplates: HabitTemplate[] = [
  {
    id: 'water-8',
    categoryId: 'health',
    title: 'Günde 8 Bardak Su',
    difficulty: 'easy',
    program: { type: 'daily', schedule: { '*': ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'] } },
  },
  {
    id: 'run-3w',
    categoryId: 'health',
    title: 'Haftada 3 Gün Koşu',
    difficulty: 'medium',
    program: { type: 'weekly', schedule: { Mon: ['07:00'], Wed: ['07:00'], Fri: ['07:00'] } },
  },
  {
    id: 'deep-work',
    categoryId: 'productivity',
    title: 'Günlük 1 Saat Derin Çalışma',
    difficulty: 'hard',
    program: { type: 'daily', schedule: { '*': ['09:00'] } },
  },
  {
    id: 'read-20',
    categoryId: 'mind',
    title: 'Günlük 20 dk Okuma',
    difficulty: 'easy',
    program: { type: 'daily', schedule: { '*': ['21:00'] } },
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: {
        themeName: 'Dark',
        pomodoro: { workSec: 25 * 60, breakSec: 5 * 60, longBreakSec: 15 * 60, cycleLen: 4, autoSwitch: true, defaultUI: 'focus' },
        keepAwakeDuringPomodoro: true,
        habitRemindersEnabled: false,
        notifyOnPomodoroEnd: true,
        weekStartsOn: 'sunday',
      },
      categories: initialCategories,
      templates: initialTemplates,
      habits: [],
      pomodoroSessions: [],

      setThemeName: (name) => set((s) => ({ settings: { ...s.settings, themeName: name } })),
      setPomodoroDefaults: (p) => set((s) => ({ settings: { ...s.settings, pomodoro: { ...s.settings.pomodoro, ...p } } })),
  setKeepAwakeDuringPomodoro: (v) => set((s) => ({ settings: { ...s.settings, keepAwakeDuringPomodoro: v } })),
  setHabitRemindersEnabled: (v) => set((s) => ({ settings: { ...s.settings, habitRemindersEnabled: v } })),
  setNotifyOnPomodoroEnd: (v) => set((s) => ({ settings: { ...s.settings, notifyOnPomodoroEnd: v } })),
  setWeekStartsOn: (v) => set((s) => ({ settings: { ...s.settings, weekStartsOn: v } })),

      acquireHabit: (templateId) => {
        const tpl = get().templates.find((t) => t.id === templateId);
        if (!tpl) throw new Error('Template not found');
        const h: Habit = {
          id: `${Date.now()}`,
          templateId: tpl.id,
          title: tpl.title,
          difficulty: tpl.difficulty,
          categoryId: tpl.categoryId,
          status: 'in-progress',
          createdAt: dayjs().toISOString(),
          progress: {},
          program: tpl.program,
        };
        set((s) => ({ habits: [h, ...s.habits] }));
        return h;
      },

      markHabitToday: (habitId, done) => set((s) => {
        const d = todayISO();
        return {
          habits: s.habits.map((h) => (h.id === habitId ? { ...h, progress: { ...h.progress, [d]: done } } : h)),
        };
      }),

      toggleHabitSlot: (habitId, dateISO, time, done) => set((s) => ({
        habits: s.habits.map((h) => {
          if (h.id !== habitId) return h;
          const day = h.slotProgress?.[dateISO] ?? {};
          const nextDay = { ...day, [time]: done };
          return { ...h, slotProgress: { ...(h.slotProgress ?? {}), [dateISO]: nextDay } };
        })
      })),

      setHabitStatus: (habitId, status) => set((s) => ({
        habits: s.habits.map((h) => (h.id === habitId ? { ...h, status } : h)),
      })),

      updateHabitTitle: (habitId, title) => set((s) => ({
        habits: s.habits.map((h) => (h.id === habitId ? { ...h, title } : h)),
      })),

      updateHabitProgram: (habitId, program) => set((s) => ({
        habits: s.habits.map((h) => (h.id === habitId ? { ...h, program } : h)),
      })),

      addPomodoroSession: (sess) => set((s) => ({ pomodoroSessions: [sess, ...s.pomodoroSessions].slice(0, 1000) })),

      habitNotificationIds: [],
      setHabitNotificationIds: (ids) => set(() => ({ habitNotificationIds: ids })),
    }),
    {
      name: 'growbit:app',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        habits: state.habits,
        pomodoroSessions: state.pomodoroSessions,
        habitNotificationIds: state.habitNotificationIds,
      }),
    }
  )
);

export const utils = {
  todayISO,
  formatDuration: (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },
  dayKey: (date: Date) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()] as keyof HabitTemplate['program']['schedule'],
  habitSlotsForDate: (habit: Habit, dateISO: string): string[] => {
    const d = dayjs(dateISO, 'YYYY-MM-DD').toDate();
    if (habit.program.type === 'daily') {
      return habit.program.schedule['*'] || [];
    }
    const key = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()] as keyof typeof habit.program.schedule;
    return (habit.program.schedule[key] as string[] | undefined) || [];
  },
  isHabitDayComplete: (habit: Habit, dateISO: string): boolean => {
    const slots = (utils as any).habitSlotsForDate(habit, dateISO) as string[];
    if (slots.length === 0) return true; // nötr günleri tam kabul ediyoruz (streak için yok sayılacak)
    const day = habit.slotProgress?.[dateISO] || {};
    return slots.every((t) => day[t]);
  },
  habitStreak: (habit: Habit): number => {
    // Bugünden geriye giderek, planlı günlerde tamamlanmış ardışık gün sayısı
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = dayjs().subtract(i, 'day');
      const iso = d.format('YYYY-MM-DD');
      const slots = (utils as any).habitSlotsForDate(habit, iso) as string[];
      if (slots.length === 0) {
        // planlı değilse streak kırılmaz, devam et
        continue;
      }
      const complete = (utils as any).isHabitDayComplete(habit, iso) as boolean;
      if (complete) streak++;
      else break;
    }
    return streak;
  },
  weekBounds: (weekStartsOn: Settings['weekStartsOn']) => {
    // returns [startISO, endISO) as dayjs
    const now = dayjs();
    if (weekStartsOn === 'monday') {
      // Monday start: get current weekday (0=Sun..6=Sat), map to Mon=0 .. Sun=6
      const day = now.day();
      const diffToMon = (day + 6) % 7; // Sun->6, Mon->0, Tue->1, ...
      const start = now.startOf('day').subtract(diffToMon, 'day');
      const end = start.add(7, 'day');
      return { start, end };
    }
    // sunday default
    const start = now.startOf('week');
    const end = now.endOf('week').add(1, 'second');
    return { start, end };
  },
};
