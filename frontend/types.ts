
export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN'
}

export interface WeeklyProgress {
  week: string;
  percentage: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string; // ISO String
  unread: boolean;
  type: 'milestone' | 'star' | 'module' | 'info';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  progress: number;
  stars: number;
  major?: string;
  idNumber?: string;
  bio?: string;
  phone?: string;
  weeklyHistory?: WeeklyProgress[];
  notifications?: Notification[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  duration: string;
  type: 'video' | 'text' | 'interactive';
  videoUrl?: string;
  externalLink?: string;
  images?: string[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  progress: number;
  lessons: Lesson[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
