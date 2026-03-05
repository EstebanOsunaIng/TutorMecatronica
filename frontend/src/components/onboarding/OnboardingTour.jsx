import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_BY_ROLE = {
  STUDENT: [
    {
      route: '/student/dashboard',
      target: '[data-tour="student-nav-dashboard"]',
      title: 'Inicio',
      body: 'Este es tu punto principal para revisar progreso, racha y actividad reciente.'
    },
    {
      route: '/student/dashboard',
      target: '[data-tour="student-dashboard-overview"]',
      title: 'Resumen academico',
      body: 'Aqui ves tus metricas clave para saber si avanzas al ritmo esperado.'
    },
    {
      route: '/student/courses',
      target: '[data-tour="student-nav-courses"]',
      title: 'Cursos',
      body: 'Desde esta seccion entras a tus modulos y continuas donde quedaste.'
    },
    {
      route: '/student/courses',
      target: '[data-tour="student-courses-grid"]',
      title: 'Modulos publicados',
      body: 'Abre un modulo para ver niveles, materiales y resolver actividades.'
    },
    {
      route: '/student/news',
      target: '[data-tour="student-nav-news"]',
      title: 'Noticias',
      body: 'Mantente al dia con novedades de tecnologia, laboratorio y comunidad academica.'
    },
    {
      route: '/student/dashboard',
      target: '[data-tour="chat-panel"]',
      title: 'Tutor IA TuVir',
      body: 'Este panel te acompana durante el estudio para resolver dudas tecnicas en tiempo real.'
    },
    {
      route: '/student/dashboard',
      target: '[data-tour="chat-input"]',
      title: 'Escribe tu consulta',
      body: 'Escribe aqui tu pregunta y TuVir te guiara paso a paso segun el contexto de tus modulos.'
    },
    {
      route: '/student/dashboard',
      target: '[data-tour="chat-attach"]',
      title: 'Adjuntar imagen',
      body: 'Usa este boton para enviar capturas o fotos y obtener una explicacion sobre lo que observas.'
    },
    {
      route: '/student/dashboard',
      target: '[data-tour="chat-mic"]',
      title: 'Dictado por voz',
      body: 'Si prefieres, activa el microfono y TuVir transcribe tu mensaje automaticamente.'
    },
    {
      route: '/student/dashboard',
      target: '[data-tour="chat-send"]',
      title: 'Enviar al asistente',
      body: 'Cuando tengas lista tu consulta, presiona enviar para iniciar la respuesta guiada.'
    },
    {
      route: '/student/settings',
      target: '[data-tour="student-nav-settings"]',
      title: 'Ajustes',
      body: 'Actualiza perfil, foto, celular y seguridad de tu cuenta institucional.'
    },
    {
      route: '/student/settings',
      target: '[data-tour="student-settings-profile"]',
      title: 'Perfil y seguridad',
      body: 'Cuando termines el recorrido, empieza por completar estos datos.'
    }
  ],
  TEACHER: [
    {
      route: '/teacher/dashboard',
      target: '[data-tour="teacher-nav-dashboard"]',
      title: 'Panel docente',
      body: 'Este panel resume tu actividad, estado de modulos y participacion estudiantil.'
    },
    {
      route: '/teacher/dashboard',
      target: '[data-tour="teacher-dashboard-overview"]',
      title: 'Indicadores clave',
      body: 'Aqui controlas rapidamente progreso general y acciones prioritarias.'
    },
    {
      route: '/teacher/students',
      target: '[data-tour="teacher-nav-students"]',
      title: 'Estudiantes',
      body: 'Consulta desempeno, avance y actividad para apoyar de forma personalizada.'
    },
    {
      route: '/teacher/students',
      target: '[data-tour="teacher-students-overview"]',
      title: 'Auditoria academica',
      body: 'Aqui revisas progreso por estudiante y detectas alertas tempranas.'
    },
    {
      route: '/teacher/modules',
      target: '[data-tour="teacher-nav-modules"]',
      title: 'Edicion de modulos',
      body: 'Crea, organiza y mejora contenido academico por niveles.'
    },
    {
      route: '/teacher/modules',
      target: '[data-tour="teacher-modules-list"]',
      title: 'Gestion de contenido',
      body: 'Desde aqui editas, revisas y administras cada modulo publicado.'
    },
    {
      route: '/teacher/knowledge',
      target: '[data-tour="teacher-nav-knowledge"]',
      title: 'Base IA',
      body: 'Sube PDFs para que TuVir responda usando contexto academico real.'
    },
    {
      route: '/teacher/knowledge',
      target: '[data-tour="knowledge-overview"]',
      title: 'Documentacion para TuVir',
      body: 'Desde aqui cargas material oficial para enriquecer respuestas del asistente.'
    },
    {
      route: '/teacher/dashboard',
      target: '[data-tour="chat-panel"]',
      title: 'Chat docente TuVir',
      body: 'Aqui puedes consultar orientaciones pedagogicas y apoyo tecnico durante tus clases.'
    },
    {
      route: '/teacher/dashboard',
      target: '[data-tour="chat-input"]',
      title: 'Consulta guiada',
      body: 'Formula preguntas sobre contenido o estrategias de acompanamiento para tus estudiantes.'
    },
    {
      route: '/teacher/dashboard',
      target: '[data-tour="chat-attach"]',
      title: 'Soporte con imagen',
      body: 'Adjunta capturas de errores, diagramas o evidencias para recibir una respuesta contextual.'
    },
    {
      route: '/teacher/dashboard',
      target: '[data-tour="chat-send"]',
      title: 'Enviar al asistente',
      body: 'Envia tu consulta para obtener una guia clara y accionable desde TuVir.'
    }
  ],
  ADMIN: [
    {
      route: '/admin/dashboard',
      target: '[data-tour="admin-nav-dashboard"]',
      title: 'Panel admin',
      body: 'Monitorea el estado general del sistema y actividad institucional.'
    },
    {
      route: '/admin/dashboard',
      target: '[data-tour="admin-dashboard-overview"]',
      title: 'Estado del sistema',
      body: 'Este bloque muestra metricas globales para decisiones rapidas.'
    },
    {
      route: '/admin/users',
      target: '[data-tour="admin-nav-users"]',
      title: 'Registro de usuarios',
      body: 'Administra perfiles, roles y accesos de toda la plataforma.'
    },
    {
      route: '/admin/users',
      target: '[data-tour="admin-users-toolbar"]',
      title: 'Herramientas de usuarios',
      body: 'Crea perfiles y genera codigos docentes desde este panel.'
    },
    {
      route: '/admin/modules',
      target: '[data-tour="admin-nav-modules"]',
      title: 'Gestion de modulos',
      body: 'Controla publicacion, estructura y consistencia del contenido academico.'
    },
    {
      route: '/admin/stats',
      target: '[data-tour="admin-nav-stats"]',
      title: 'Estadisticas',
      body: 'Analiza tendencias de uso, registros y actividad por periodo.'
    },
    {
      route: '/admin/stats',
      target: '[data-tour="admin-stats-overview"]',
      title: 'Analitica avanzada',
      body: 'Utiliza estos reportes para sustentar decisiones de gestion y mejora continua.'
    },
    {
      route: '/admin/dashboard',
      target: '[data-tour="chat-panel"]',
      title: 'Asistente de apoyo',
      body: 'Este chat te ayuda a resolver dudas operativas y tecnicas en la administracion de la plataforma.'
    },
    {
      route: '/admin/dashboard',
      target: '[data-tour="chat-input"]',
      title: 'Preguntas de gestion',
      body: 'Describe el caso que quieras analizar y TuVir te entregara una guia por pasos.'
    },
    {
      route: '/admin/dashboard',
      target: '[data-tour="chat-history"]',
      title: 'Historial de conversaciones',
      body: 'Revisa consultas anteriores para mantener continuidad en soporte y seguimiento.'
    },
    {
      route: '/admin/dashboard',
      target: '[data-tour="chat-send"]',
      title: 'Enviar consulta',
      body: 'Con este boton procesas la pregunta y recibes recomendaciones basadas en contexto.'
    }
  ]
};

function waitForElement(selector, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const immediate = document.querySelector(selector);
    if (immediate) {
      resolve(immediate);
      return;
    }

    const started = Date.now();
    const id = window.setInterval(() => {
      const node = document.querySelector(selector);
      if (node) {
        window.clearInterval(id);
        resolve(node);
        return;
      }

      if (Date.now() - started > timeoutMs) {
        window.clearInterval(id);
        resolve(null);
      }
    }, 120);
  });
}

export default function OnboardingTour({ role = 'STUDENT', open, onFinish, userId = '', runSeed = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const driverRef = useRef(null);
  const onFinishRef = useRef(onFinish);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = useMemo(() => TOUR_BY_ROLE[role] || TOUR_BY_ROLE.STUDENT, [role]);
  const progressKey = useMemo(() => `onboarding:progress:${userId || 'anon'}:${role}:v1`, [role, userId]);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if (!open) return;
    if (!runSeed) return;
    localStorage.removeItem(progressKey);
    setStepIndex((prev) => (prev === 0 ? prev : 0));
  }, [open, progressKey, runSeed]);

  useEffect(() => {
    if (!open) return;
    const raw = localStorage.getItem(progressKey);
    const parsed = Number(raw || 0);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed < steps.length) {
      setStepIndex((prev) => (prev === parsed ? prev : parsed));
    } else {
      setStepIndex((prev) => (prev === 0 ? prev : 0));
    }
  }, [open, progressKey, steps.length]);

  useEffect(() => {
    if (!open) return;
    localStorage.setItem(progressKey, String(stepIndex));
  }, [open, progressKey, stepIndex]);

  useEffect(() => {
    if (!open || steps.length === 0) return undefined;

    const step = steps[Math.max(0, Math.min(stepIndex, steps.length - 1))];
    if (step?.route && location.pathname !== step.route) {
      navigate(step.route);
      return undefined;
    }

    let cancelled = false;

    const mountStep = async () => {
      const el = await waitForElement(step.target, 6000);
      if (cancelled) return;

      if (!el) {
        const next = stepIndex + 1;
        if (next >= steps.length) {
          localStorage.removeItem(progressKey);
          onFinishRef.current?.();
          return;
        }
        setStepIndex((prev) => (prev === next ? prev : next));
        return;
      }

      const isLast = stepIndex >= steps.length - 1;
      const instance = driver({
        allowClose: false,
        animate: true,
        showProgress: true,
        disableActiveInteraction: true,
        stagePadding: 8,
        stageRadius: 10,
        popoverClass: 'tuvir-tour-popover',
        overlayOpacity: 0.58,
        steps: [
          {
            element: step.target,
            popover: {
              title: step.title,
              description: step.body,
              side: 'bottom',
              align: 'start',
              showButtons: stepIndex === 0 ? ['next'] : ['previous', 'next'],
              nextBtnText: isLast ? 'Finalizar' : 'Siguiente',
              prevBtnText: 'Anterior',
              onNextClick: () => {
                instance.destroy();
                if (isLast) {
                  localStorage.removeItem(progressKey);
                  onFinishRef.current?.();
                  return;
                }
                setStepIndex((prev) => prev + 1);
              },
              onPrevClick: () => {
                instance.destroy();
                setStepIndex((prev) => Math.max(0, prev - 1));
              }
            }
          }
        ]
      });

      driverRef.current = instance;
      instance.drive();
    };

    mountStep();

    return () => {
      cancelled = true;
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    };
  }, [location.pathname, navigate, open, progressKey, stepIndex, steps]);

  return null;
}
