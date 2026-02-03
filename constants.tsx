
import { Module, User, UserRole } from './types';

// Fix: Added missing required 'stars' property
export const MOCK_USER_STUDENT: User = {
  id: 'u1',
  name: 'Alex Chen',
  email: 'alex.chen@universitaria.edu.co',
  role: UserRole.STUDENT,
  avatar: 'https://picsum.photos/seed/alex/100/100',
  progress: 68,
  stars: 3
};

// Fix: Added missing required 'stars' property
export const MOCK_USER_ADMIN: User = {
  id: 'u2',
  name: 'Dra. María González',
  email: 'maria.g@universitaria.edu.co',
  role: UserRole.ADMIN,
  avatar: 'https://picsum.photos/seed/maria/100/100',
  progress: 100,
  stars: 5
};

export const MOCK_MODULES: Module[] = [
  {
    id: 'm1',
    title: 'Fundamentos de Robótica',
    description: 'Cinemática, dinámica y sistemas de control para robots industriales.',
    category: 'Robótica',
    difficulty: 'Intermedio',
    progress: 85,
    lessons: [
      { id: 'l1', title: 'Introducción a Actuadores', content: '...', completed: true, duration: '15m', type: 'video' },
      { id: 'l2', title: 'Matrices de Transformación', content: '...', completed: true, duration: '25m', type: 'interactive' },
      { id: 'l3', title: 'Control PID en Motores DC', content: '...', completed: false, duration: '40m', type: 'video' }
    ]
  },
  {
    id: 'm2',
    title: 'Electrónica de Potencia',
    description: 'Convertidores AC/DC, inversores y control de motores de alta potencia.',
    category: 'Electrónica',
    difficulty: 'Avanzado',
    progress: 30,
    lessons: [
      { id: 'l4', title: 'Tiristores y Triacs', content: '...', completed: true, duration: '20m', type: 'text' },
      { id: 'l5', title: 'Diseño de Rectificadores', content: '...', completed: false, duration: '35m', type: 'video' }
    ]
  },
  {
    id: 'm3',
    title: 'Diseño Mecánico Asistido',
    description: 'Modelado 3D y análisis de esfuerzos mediante software CAD/CAE.',
    category: 'Diseño',
    difficulty: 'Básico',
    progress: 0,
    lessons: [
      { id: 'l6', title: 'Sketching y Restricciones', content: '...', completed: false, duration: '45m', type: 'interactive' }
    ]
  }
];

// Fix: Added missing required 'stars' property to each student
export const MOCK_STUDENTS: User[] = [
  { id: 's1', name: 'Juan Pérez', email: 'juan@mail.com', role: UserRole.STUDENT, progress: 45, avatar: 'https://picsum.photos/seed/s1/100/100', stars: 2 },
  { id: 's2', name: 'Laura Ruiz', email: 'laura@mail.com', role: UserRole.STUDENT, progress: 92, avatar: 'https://picsum.photos/seed/s2/100/100', stars: 4 },
  { id: 's3', name: 'Carlos Díaz', email: 'carlos@mail.com', role: UserRole.STUDENT, progress: 12, avatar: 'https://picsum.photos/seed/s3/100/100', stars: 0 },
  { id: 's4', name: 'Sofía Mena', email: 'sofia@mail.com', role: UserRole.STUDENT, progress: 77, avatar: 'https://picsum.photos/seed/s4/100/100', stars: 3 }
];
