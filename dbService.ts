
import { User, UserRole, Module, Lesson, Notification } from '../types';
import { MOCK_MODULES } from '../constants';

const DB_KEYS = {
  USERS: 'tuvir_users',
  CURRENT_USER: 'tuvir_current_session',
  MODULES: 'tuvir_modules',
};

const ENRICHED_MOCKS = MOCK_MODULES.map(m => ({
  ...m,
  lessons: m.lessons.map(l => ({
    ...l,
    content: `Bienvenido a la lección de ${l.title}. \n\nEn este nivel aprenderás los fundamentos teóricos aplicados a la mecatrónica industrial. \n\nRecuerda revisar el material multimedia y PDF adjunto para completar los ejercicios prácticos en el laboratorio.`
  }))
}));

export const dbService = {
  init() {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      const initialUsers = [
        { 
          id: 'u1', 
          name: 'Alex Mecatrónico', 
          email: 'demo@universitaria.edu.co', 
          password: '123', 
          role: UserRole.STUDENT, 
          progress: 25,
          stars: 1,
          major: 'Ingeniería Mecatrónica',
          idNumber: '1090123456',
          weeklyHistory: [
            { week: 'Lunes', percentage: 10 }, 
            { week: 'Martes', percentage: 12 }, 
            { week: 'Miércoles', percentage: 18 }, 
            { week: 'Jueves', percentage: 22 }, 
            { week: 'Viernes', percentage: 25 }
          ],
          bio: 'Fanático de la automatización y robótica de precisión.',
          phone: '+57 300 123 4567',
          notifications: []
        },
        { 
          id: 'u2', 
          name: 'Dra. Elena Ruiz', 
          email: 'admin@universitaria.edu.co', 
          password: '123', 
          role: UserRole.ADMIN, 
          progress: 100,
          stars: 5,
          major: 'Facultad de Ingeniería',
          notifications: []
        }
      ];
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(initialUsers));
    }
    if (!localStorage.getItem(DB_KEYS.MODULES)) {
      localStorage.setItem(DB_KEYS.MODULES, JSON.stringify(ENRICHED_MOCKS));
    }
  },

  getModules(): Module[] {
    return JSON.parse(localStorage.getItem(DB_KEYS.MODULES) || '[]');
  },

  saveModule(module: Module) {
    const modules = this.getModules();
    let isNew = false;
    let finalModule = module;

    if (!module.id) {
      isNew = true;
      finalModule = { ...module, id: Math.random().toString(36).substr(2, 9) };
      modules.push(finalModule);
    } else {
      const index = modules.findIndex(m => m.id === module.id);
      if (index !== -1) {
        modules[index] = module;
      }
    }
    
    localStorage.setItem(DB_KEYS.MODULES, JSON.stringify(modules));

    if (isNew) {
      this.getUsers().forEach(u => {
        if (u.role === UserRole.STUDENT) {
          this.addNotification(u.id, {
            title: 'Nuevo Módulo Académico',
            message: `"${finalModule.title}" ya está disponible en tu ruta de aprendizaje.`,
            type: 'module'
          });
        }
      });
    }

    return modules;
  },

  deleteModule(id: string) {
    const modules = this.getModules().filter(m => m.id !== id);
    localStorage.setItem(DB_KEYS.MODULES, JSON.stringify(modules));
    return modules;
  },

  getUsers(): User[] {
    return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
  },

  updateUser(updatedUser: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedUser };
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
      
      const currentSession = this.getCurrentSession();
      if (currentSession && currentSession.id === updatedUser.id) {
        localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(users[index]));
      }
      return users[index];
    }
    throw new Error('Usuario no encontrado');
  },

  addNotification(userId: string, data: Pick<Notification, 'title' | 'message' | 'type'>) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      const newNotif: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        time: new Date().toISOString(),
        unread: true
      };
      const notifications = users[index].notifications || [];
      users[index].notifications = [newNotif, ...notifications].slice(0, 15);
      this.updateUser(users[index]);
    }
  },

  markNotificationRead(userId: string, notificationId: string) {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1 && users[userIndex].notifications) {
      users[userIndex].notifications = users[userIndex].notifications!.map(n => 
        n.id === notificationId ? { ...n, unread: false } : n
      );
      this.updateUser(users[userIndex]);
    }
  },

  clearAllNotifications(userId: string) {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].notifications = [];
      this.updateUser(users[userIndex]);
    }
  },

  login(email: string, pass: string) {
    const users = this.getUsers() as any[];
    const user = users.find(u => u.email === email && u.password === pass);
    if (!user) throw new Error('Credenciales incorrectas');
    localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  },

  register(user: any) {
    const users = this.getUsers();
    if (users.find((u: any) => u.email === user.email)) throw new Error('El email ya existe');
    const newUser = { 
      ...user, 
      id: Math.random().toString(36).substr(2, 9), 
      progress: 0,
      stars: 0,
      weeklyHistory: [{ week: 'Hoy', percentage: 0 }],
      notifications: []
    };
    users.push(newUser);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    return newUser;
  },

  resetPassword(email: string) {
    const users = this.getUsers();
    const user = users.find((u: any) => u.email === email);
    if (!user) throw new Error('Correo no registrado');
    return true;
  },

  logout() {
    localStorage.removeItem(DB_KEYS.CURRENT_USER);
  },

  getCurrentSession(): User | null {
    const data = localStorage.getItem(DB_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }
};
