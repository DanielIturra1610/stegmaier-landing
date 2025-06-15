// src/components/sections/home/steps-data.ts
import type { Step } from "../../../types";
import * as L from "lucide-react";

export const steps: Step[] = [
  {
    id: 1,
    title: "Diagnóstico inicial",
    desc: "Levantamiento de procesos y evaluación de brechas.",
    icon: L.Search,
  },
  {
    id: 2,
    title: "Plan de acción",
    desc: "Roadmap de 12 semanas con hitos claros.",
    icon: L.Map,
  },
  {
    id: 3,
    title: "Capacitación",
    desc: "Formación de equipos y roles clave.",
    icon: L.Users,
  },
  {
    id: 4,
    title: "Documentación",
    desc: "Procedimientos y registros imprescindibles.",
    icon: L.FileText,
  },
  {
    id: 5,
    title: "Implementación",
    desc: "Puesta en marcha y seguimiento de controles.",
    icon: L.Settings2,
  },
  {
    id: 6,
    title: "Auditoría interna",
    desc: "Verificación de conformidad y acciones correctivas.",
    icon: L.BadgeCheck,
  },
  {
    id: 7,
    title: "Certificación externa",
    desc: "Acompañamiento durante la auditoría de certificación.",
    icon: L.Award,
  },
  {
    id: 8,
    title: "Mejora continua",
    desc: "KPIs y revisiones para sostener el sistema.",
    icon: L.RefreshCcw,
  },
];
