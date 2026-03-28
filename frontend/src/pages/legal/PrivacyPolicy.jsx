import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, BookOpenText, Building2, CheckCircle2, FileText, Lock, Mail, Shield, UserRound } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

const sections = [
  {
    icon: Building2,
    title: 'Responsable del tratamiento',
    content: String.raw`Política de Privacidad y Protección de Datos Personales

1. Quién es el responsable del Tratamiento de Datos

La presente Política de Privacidad aplica para la firma EMPRESA  SAS, identificada con NIT 901.000.000-0, con domicilio en Calle 123 No. 123-123, Ciudad de Bogotá DC, Colombia. En adelante “La Empresa”, propietaria del sitio web Empresa .co, y responsable del tratamiento de los datos personales que recolecta de sus clientes, usuarios y terceros relacionados con la prestación de servicios de asesoría y gestión comercial entre los que se detallan el régimen de insolvencia para personas naturales y pequeñas empresas (Ley 2445 de 2018).`,
    span: 'lg:col-span-2'
  },
  {
    icon: UserRound,
    title: 'Datos Personales que Recolectamos',
    content: String.raw`2. Datos Personales que Recolectamos

La Empresa podrá recolectar, almacenar y procesar datos personales tales como:
•	Identificación: nombres, apellidos, tipo y número de documento.
•	Información de contacto: dirección, correo electrónico, teléfono.
•	Datos financieros y económicos: ingresos, deudas, activos, estado    financiero.
•	Información de contexto de insolvencia: documentos, estados de cuenta, contratos.
•	Cualquier otro dato necesario para la correcta prestación de los servicios contratados.`
  },
  {
    icon: BadgeCheck,
    title: 'Finalidades del Tratamiento',
    content: String.raw`3. Finalidades del Tratamiento

Los datos personales serán usados para:
•	Prestar, gestionar y administrar servicios de asesoría en insolvencia según la Ley 2445 de Colombia.
•	Procesar, analizar y estructurar información necesaria para la presentación de trámites, solicitudes o actuaciones ante autoridades competentes.
•	Comunicarnos con clientes y terceros involucrados.
•	Enviar notificaciones, alertas, actualizaciones y documentación relacionada con servicios contratados.
•	Cumplir con obligaciones legales, judiciales, fiscales y regulatorias.
•	Elaborar reportes e informes de gestión interna.`
  },
  {
    icon: BookOpenText,
    title: 'Normativas y consentimiento',
    content: String.raw`4. Leyes y Normativas Aplicables

El tratamiento de datos personales se realiza en cumplimiento de:
•	Ley Estatutaria 1581 de 2012 – Protección de Datos Personales.
•	Decreto 1377 de 2013 – Reglamentación de la Ley 1581.
•	Otras normas relacionadas con protección de datos y tratamiento de información financiera y judicial en Colombia.

Consentimiento
El titular de los datos presta su consentimiento libre, previo, expreso e informado para el tratamiento de sus datos personales, mediante:
•	Firma de documentos físicos o electrónicos.
•	Aceptación de esta política al registrarse o contratar servicios.
•	Cualquier medio válido reconocido en derecho que demuestre el consentimiento.`,
    span: 'lg:col-span-2'
  },
  {
    icon: FileText,
    title: 'Uso de los Datos',
    content: String.raw`5. Uso de los Datos

Los datos personales serán tratados de forma confidencial y sólo serán usados para los fines autorizados por el titular o exigidos por la ley. No se venderán, cederán ni transferirán a terceros sin autorización expresa, salvo obligación legal.`
  },
  {
    icon: Mail,
    title: 'Derechos de los Titulares',
    content: String.raw`6. Derechos de los Titulares

Los titulares de los datos personales tienen derecho a:
•	Conocer, actualizar y rectificar sus datos.
•	Solicitar prueba del consentimiento otorgado.
•	Revocar autorización y/o solicitar la supresión de sus datos cuando no exista una obligación legal que impida su eliminación.
•	Acceder a sus datos y conocer las disposiciones de esta política.

Las solicitudes pueden hacerse a través de:
www: Empresa .co
📩 	Correo electrónico: [info@Empresa .co]
📞 	Teléfono: 321000000
📍 	Dirección: Calle 123 No. 123-42 Bogotá DC, Colombia

Las solicitudes serán atendidas en los términos y condiciones establecidos por el Decreto 1377 de junio 27 - 2013.`,
    span: 'lg:col-span-2'
  },
  {
    icon: Lock,
    title: 'Seguridad, transferencia y vigencia',
    content: String.raw`7. Seguridad de la Información

La Empresa adopta las medidas técnicas, humanas y administrativas necesarias para garantizar la seguridad de los datos personales y así prevenir acceso no autorizado, pérdida, divulgación, alteración o uso indebido.

8. Transferencia y Terceros

Los datos personales sólo serán compartidos con terceros cuando:
•	Sea necesario para cumplir con la prestación del servicio contratado.
•	Exista obligación legal o requerimiento judicial.
•	El titular haya dado autorización expresa para ello.

9. Modificaciones a la Política

La Empresa podrá modificar esta Política de Privacidad en cualquier momento, en cuyo caso se avisará oportunamente a los titulares por medio de los canales habilitados.

11. Vigor y Aceptación
    La presente política entra en vigencia desde la fecha de publicación y aplicación en todos los servicios ofrecidos por la Empresa. El uso de nuestros servicios y/o la entrega de datos personales implica la aceptación de esta política.

---

Pedro Perez
Gerencia General Empresa  SAS`,
    span: 'lg:col-span-2'
  },
  {
    icon: Shield,
    title: 'Aviso de Privacidad',
    content: String.raw`AVISO DE PRIVACIDAD (versión corta para WEB)
Este va en el pie de página o antes del botón “Enviar” del formulario:
======================================================================

Aviso de Privacidad.
En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, Empresa SAS, identificada con NIT 901.000.000-0, informa que los datos personales suministrados serán tratados con la finalidad de prestar servicios de asesoría y gestión en el régimen de insolvencia de persona natural y pequeña empresa conforme a la Ley 2445 de Colombia.
El titular podrá ejercer sus derechos de conocer, actualizar, rectificar o suprimir sus datos escribiendo a: [[info@empresa.co](mailto:info@empresa.co)].
Al enviar este formulario usted autoriza el tratamiento de sus datos personales conforme a nuestra Política de Privacidad.`,
    span: 'lg:col-span-2'
  },
  {
    icon: BadgeCheck,
    title: 'Cláusula para checkbox en formulario web',
    content: String.raw`CLÁUSULA PARA CHECKBOX EN FORMULARIO WEB.

Esta es la que va con la casilla obligatoria:
☐ He leído y acepto la Política de privacidad de datos y Autorizo de manera libre, previa, expresa e informada a EMPRESA SAS NIT 901.000.000-0 para tratar mis datos personales con la finalidad de recibir asesoría y gestión en procesos de insolvencia de persona natural o pequeña empresa según la Ley 2445 de febrero 11- 2025 en Colombia. Los datos serán tratados de conformidad a la Ley 1581 octubre 17 de 2012 en Colombia.`,
    span: 'lg:col-span-2'
  },
  {
    icon: FileText,
    title: 'Autorización para contratos o poderes',
    content: String.raw`====================================================
CLÁUSULA DE AUTORIZACIÓN PARA CONTRATOS O PODERES

AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES
El CLIENTE autoriza de manera libre, previa, expresa e informada a EMPRESA SAS, identificada con NIT 901.000.000-0, para recolectar, almacenar, usar, circular y suprimir sus datos personales, incluyendo datos financieros, patrimoniales, económicos y documentación relacionada con su situación de insolvencia, con el fin de:

1. Prestar asesoría jurídica en el marco del régimen de insolvencia de persona natural y pequeña empresa.
2. Presentar solicitudes, trámites y actuaciones ante centros de conciliación, jueces y autoridades competentes.
3. Cumplir obligaciones legales y contractuales.
   La Empresa garantizará la confidencialidad y seguridad de la información conforme a la Ley 1581 de 2012.
   El titular podrá ejercer sus derechos enviando solicitud al correo: [[info@empresa.co](mailto:info@empresa.co)].`,
    span: 'lg:col-span-2'
  },
  {
    icon: Mail,
    title: 'Aviso previo de tratamiento',
    content: String.raw`======================================================
AVISO PREVIO DE TRATAMIENTO
(para primer contacto por whatsapp o email)

Estimado usuario,
Antes de enviarnos información personal o financiera, le informamos que los datos suministrados serán tratados por la firma Empresa SAS con el fin de brindarle asesoría en procesos de insolvencia de persona natural o pequeña empresa.
Al enviarnos su información usted autoriza el tratamiento de sus datos conforme a la Ley 1581 de 2012. Puede consultar nuestra política completa en: [[www.empresa.co/link](http://www.empresa.co/link) página web].`,
    span: 'lg:col-span-2'
  },
  {
    icon: Building2,
    title: 'Aspectos Generales',
    content: String.raw`---

Aspectos Generales

1. Ámbito de aplicación
   Esta política es aplicable a toda información determinada como dato personal que están bajo la responsabilidad del tratamiento de la Institución Universitaria de Colombia. Todos estudiantes, docentes, funcionarios, contratistas, proveedores de servicios o personal externo de la Institución Universitaria de Colombia, que por su labor recolectan, almacenan, usan, circulan o supriman datos e información de la Institución Universitaria de Colombia, deberán conocer y dar cumplimiento a la presente política.

2. Objetivo
   Establecer los lineamientos para garantizar el adecuado cumplimiento de lo dispuesto en la Ley 1581 de 2012 y Decreto 1377 de 2013, para la gestión en materia de tratamiento de datos personales y privacidad en la Institución Universitaria de Colombia.

3. Principios rectores del Tratamiento de Datos
   El tratamiento se rige por los principios legales establecidos en la Ley 1581 de 2012: legalidad, finalidad, libertad, veracidad, seguridad, confidencialidad, transparencia y acceso restringido.

4. Política de Privacidad
   Nos comprometemos a guardar toda la información recogida en una base de datos con un nivel razonable de seguridad a la que tenemos acceso solo nosotros (Institución Universitaria de Colombia) y nuestra agencia de contenidos –con la que tenemos estrictos protocolos de confidencialidad–. Nos comprometemos a no compartir con terceros la información suministrada por los usuarios.`,
    span: 'lg:col-span-2'
  },
  {
    icon: Shield,
    title: 'Seguridad Digital y Protección de Información',
    content: String.raw`Seguridad Digital y Protección de Información

1. Política de control de acceso
   Los datos personales e interacciones que los usuarios proporcionen voluntariamente a través de la plataforma virtual y nuestras cuentas en redes sociales se usarán exclusivamente para brindar información institucional, responder consultas, promover actividades académicas y fomentar la participación de la comunidad universitaria.

Autenticación obligatoria: Credenciales únicas (usuario y contraseña) o autenticación de dos factores
Gestión de perfiles y roles: Acceso únicamente a información necesaria
Monitoreo y auditoría de accesos para detectar intentos de intrusión
Contraseñas seguras con requisitos mínimos de seguridad
Acceso remoto bajo conexión segura (VPN, túneles cifrados)
2. Política de Seguridad Digital
La Institución implementa una política integral basada en tres pilares fundamentales:

Confidencialidad: Información accesible solo por personas autorizadas
Integridad: Garantizar exactitud y completitud de la información
Disponibilidad: Servicios disponibles cuando se necesiten`,
    span: 'lg:col-span-2'
  },
  {
    icon: BookOpenText,
    title: 'Tratamiento de Datos Personales',
    content: String.raw`Tratamiento de Datos Personales

1. Finalidades del tratamiento
   Los datos personales recolectados serán utilizados para:

Registrar información para trámites académicos y administrativos
Establecer comunicación con el titular
Analizar estadísticas de desempeño institucional
Cumplir con obligaciones legales y contractuales
Gestionar actividades de bienestar, investigación y extensión
Promover programas académicos y eventos institucionales
2. Procedimiento para consulta de datos
El titular puede consultar su información mediante solicitud a través de correo electrónico ([info@universitariadecolombia.edu.co](mailto:info@universitariadecolombia.edu.co)) o plataforma digital. La institución atenderá la solicitud en máximo 10 días hábiles.

3. Actualización, rectificación y supresión
   Los titulares pueden solicitar actualización, corrección o supresión de datos en cualquier momento. La respuesta se dará dentro de 15 días hábiles.`,
    span: 'lg:col-span-2'
  },
  {
    icon: Lock,
    title: 'Medidas de Seguridad',
    content: String.raw`Medidas de Seguridad
Gestión de Incidentes
Contamos con un plan de respuesta ante incidentes que comprometan la seguridad:

Detección y notificación del incidente
Clasificación según severidad e impacto
Contención y mitigación de daños
Investigación y análisis forense
Comunicación a titulares y autoridades cuando corresponda
Documentación y acciones correctivas
Criptografía
Utilizamos mecanismos de cifrado en transmisión y almacenamiento de información sensible, conforme a estándares internacionales (AES, TLS).

Plan de Recuperación ante Desastres
Contamos con procedimientos para restaurar operaciones en caso de fallas graves, desastres naturales o ciberataques, incluyendo copias de seguridad periódicas y pruebas regulares del plan.`,
    span: 'lg:col-span-2'
  },
  {
    icon: BadgeCheck,
    title: 'Derechos, uso y propiedad intelectual',
    content: String.raw`Derechos de los Titulares
Sus derechos incluyen
Conocer, actualizar y rectificar sus datos personales
Solicitar prueba de la autorización otorgada
Ser informado sobre el uso dado a sus datos
Presentar quejas ante la Superintendencia de Industria y Comercio
Revocar la autorización y/o solicitar la supresión de datos
Acceder de forma gratuita a sus datos personales
Condiciones de Uso
Deberes de los usuarios
Respetar las políticas institucionales y legales
Usar los canales oficiales de forma respetuosa y ética
Reportar cualquier falla o incidente de seguridad
Prohibiciones
Difundir contenido falso, malicioso o discriminatorio
Acceder sin autorización a sistemas o bases de datos
Realizar actos que afecten la reputación institucional
Propiedad Intelectual
Todos los contenidos son propiedad exclusiva de la Institución Universitaria de Colombia. Está prohibida su reproducción sin autorización previa, conforme a la Ley 23 de 1982.`,
    span: 'lg:col-span-2'
  }
];

function renderContent(content, isDark) {
  const lines = String(content || '').split('\n');

  return lines.map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) return <div key={`space-${index}`} className="h-3" />;

    if (trimmed === '---' || /^=+$/.test(trimmed)) {
      return <div key={`divider-${index}`} className={`my-2 h-px w-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />;
    }

    if (trimmed.startsWith('•')) {
      return (
        <div key={`bullet-${index}`} className="flex items-start gap-2.5 py-1.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
          <p className={`text-sm leading-7 ${isDark ? 'text-slate-200' : 'text-[#060273]'}`}>{line}</p>
        </div>
      );
    }

    const isHeading = /^\d+\./.test(trimmed) || /^[A-ZÁÉÍÓÚÑ].*:$/.test(trimmed) || trimmed === trimmed.toUpperCase();

    if (isHeading) {
      return (
        <p key={`heading-${index}`} className={`pt-1 text-[0.98rem] font-semibold leading-7 ${isDark ? 'text-white' : 'text-[#07038C]'}`}>
          {line}
        </p>
      );
    }

    return <p key={`line-${index}`} className={`text-sm leading-7 ${isDark ? 'text-slate-200' : 'text-[#060273]'}`}>{line}</p>;
  });
}

function SectionCard({ icon: Icon, title, content, isDark, span = '' }) {
  return (
    <article
      className={`group overflow-hidden rounded-[14px] border transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_32px_-22px_rgba(7,3,140,0.22)] ${
        isDark
          ? 'border-slate-700 bg-[#1E1E1E] shadow-[0_14px_28px_-22px_rgba(0,0,0,0.55)] hover:border-slate-500'
          : 'border-[#d9e0ec] bg-[#FFFFFF] shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-[#c8d2ef]'
      } ${span}`}
    >
      <div className="flex items-center gap-4 bg-[#07038C] px-6 py-5">
        <div
          className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-full border ${
            isDark ? 'border-white/15 bg-white/12 text-[#F2CB05]' : 'border-white/25 bg-white/16 text-[#F2CB05]'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-[1.05rem] font-semibold tracking-tight text-white sm:text-[1.15rem]">{title}</h2>
      </div>

      <div className="space-y-0 px-6 py-6">{renderContent(content, isDark)}</div>
    </article>
  );
}

export default function PrivacyPolicy() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen w-full px-4 py-6 sm:px-6 sm:py-8 ${isDark ? 'bg-[#121212] text-white' : 'bg-[#f5f7fb] text-[#060273]'}`} style={{ fontFamily: 'Roboto, sans-serif' }}>
      <div className="mx-auto max-w-[1100px]">
        <div
          className={`mb-7 overflow-hidden rounded-[18px] border ${
            isDark ? 'border-slate-700 bg-[radial-gradient(circle_at_top_left,_rgba(242,203,5,0.12),_transparent_28%),linear-gradient(145deg,#101010,#181818)]' : 'border-[#dbe1f3] bg-[radial-gradient(circle_at_top_left,_rgba(242,203,5,0.12),_transparent_22%),linear-gradient(145deg,#ffffff,#f8faff)]'
          }`}
        >
          <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${isDark ? 'bg-[#07038C]/70 text-[#F2CB05]' : 'bg-[#07038C] text-[#F2CB05]'}`}>
                Politicas y privacidad
              </div>
              <h1 className={`text-3xl font-black tracking-tight sm:text-4xl ${isDark ? 'text-white' : 'text-[#07038C]'}`}>Politica de Privacidad</h1>
              <p className={`mt-3 max-w-2xl text-sm leading-7 sm:text-base ${isDark ? 'text-slate-300' : 'text-[#060273]/88'}`}>
                Consulta cada politica en bloques organizados para una lectura mas clara, manteniendo el contenido legal exactamente igual.
              </p>
            </div>

            <Link
              to="/"
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold uppercase tracking-[0.08em] transition ${
                isDark ? 'bg-[#F2CB05] text-[#07038C] hover:brightness-95' : 'bg-[#07038C] text-white hover:bg-[#0b079f]'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
          {sections.map((section) => (
            <SectionCard key={section.title} {...section} isDark={isDark} />
          ))}
        </div>
      </div>
    </div>
  );
}
