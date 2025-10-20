/**
 * Servicio para manejo de submissions tardías y cálculo de penalizaciones
 * Integra con el sistema de assignments para aplicar políticas de late submission
 */
import { Assignment, AssignmentSubmission } from '../types/assignment';
import { assignmentNotificationService } from './assignmentNotificationService';

export interface LateSubmissionPolicy {
  allow_late_submissions: boolean;
  late_penalty_per_day: number; // Porcentaje de penalización por día
  max_late_penalty: number; // Penalización máxima (porcentaje)
  max_late_days: number; // Días máximos permitidos de retraso
  grace_period_hours: number; // Período de gracia en horas
}

export interface LateSubmissionAnalysis {
  is_late: boolean;
  days_late: number;
  hours_late: number;
  penalty_percentage: number;
  original_grade: number | null;
  penalized_grade: number | null;
  max_possible_grade: number;
  can_still_submit: boolean;
  grace_period_active: boolean;
}

class LateSubmissionService {
  private defaultPolicy: LateSubmissionPolicy = {
    allow_late_submissions: true,
    late_penalty_per_day: 10, // 10% por día
    max_late_penalty: 50, // Máximo 50% de penalización
    max_late_days: 7, // Máximo 7 días tarde
    grace_period_hours: 2 // 2 horas de gracia
  };

  /**
   * Analizar el estado de late submission para un assignment
   */
  analyzeSubmission(
    assignment: Assignment,
    submission: AssignmentSubmission | null,
    submissionDate?: Date
  ): LateSubmissionAnalysis {
    const now = submissionDate || new Date();
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
    
    // Si la tarea ya fue calificada con penalización aplicada
    if (submission?.penalty_applied && submission.penalty_applied > 0 && dueDate) {
      const isLate = submission.penalty_applied > 0;
      const daysLate = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const hoursLate = Math.max(0, (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60));
      const gracePeriodActive = hoursLate > 0 && hoursLate <= this.getAssignmentPolicy(assignment).grace_period_hours;
      return {
        is_late: isLate,
        days_late: daysLate,
        hours_late: hoursLate,
        penalty_percentage: submission.penalty_applied,
        original_grade: submission.total_points_earned ? submission.total_points_earned / (1 - submission.penalty_applied / 100) : null,
        penalized_grade: submission.total_points_earned || null,
        max_possible_grade: assignment.max_points,
        can_still_submit: this.canSubmit(assignment, now).can_submit,
        grace_period_active: gracePeriodActive
      };
    }

    if (!dueDate) {
      const currentGrade = submission?.total_points_earned || null;
      return {
        is_late: false,
        days_late: 0,
        hours_late: 0,
        penalty_percentage: 0,
        original_grade: currentGrade,
        penalized_grade: currentGrade,
        max_possible_grade: assignment.max_points,
        can_still_submit: true,
        grace_period_active: false
      };
    }

    const policy = this.getAssignmentPolicy(assignment);
    const timeDiffMs = now.getTime() - dueDate.getTime();
    const hoursLate = Math.max(0, timeDiffMs / (1000 * 60 * 60));
    const daysLate = Math.max(0, Math.ceil((timeDiffMs - policy.grace_period_hours * 60 * 60 * 1000) / (1000 * 60 * 60 * 24)));
    
    const isLate = hoursLate > policy.grace_period_hours;
    const gracePeriodActive = hoursLate > 0 && hoursLate <= policy.grace_period_hours;
    const penaltyPercentage = this.calculatePenalty(daysLate, policy);

    // Determinar si aún puede enviar
    const canStillSubmit = !isLate || 
      (policy.allow_late_submissions && daysLate <= policy.max_late_days);

    // Calcular calificación con penalización usando total_points_earned
    const currentGrade = submission?.total_points_earned || null;
    let penalizedGrade = currentGrade;
    if (currentGrade && isLate && penaltyPercentage > 0) {
      const maxGradeAfterPenalty = assignment.max_points * (1 - penaltyPercentage / 100);
      penalizedGrade = Math.min(currentGrade, maxGradeAfterPenalty);
    }

    return {
      is_late: isLate,
      days_late: Math.floor(daysLate),
      hours_late: hoursLate,
      penalty_percentage: penaltyPercentage,
      original_grade: currentGrade,
      penalized_grade: penalizedGrade,
      max_possible_grade: assignment.max_points * (1 - penaltyPercentage / 100),
      can_still_submit: canStillSubmit,
      grace_period_active: gracePeriodActive
    };
  }

  /**
   * Aplicar penalización automática a una submission tardía
   */
  async applyLatePenalty(
    submission: AssignmentSubmission,
    assignment: Assignment,
    originalGrade: number
  ): Promise<number> {
    try {
      console.log('⏰ [LateSubmission] Applying late penalty to submission:', submission.id);
      
      const analysis = this.analyzeSubmission(assignment, submission, 
        submission.submitted_at ? new Date(submission.submitted_at) : new Date()
      );

      if (!analysis.is_late) {
        console.log('✅ Submission is not late, no penalty applied');
        return originalGrade;
      }

      const penalizedGrade = Math.min(originalGrade, analysis.max_possible_grade);
      const penaltyAmount = originalGrade - penalizedGrade;

      if (penaltyAmount > 0) {
        console.log(`📉 Late penalty applied: ${analysis.penalty_percentage}% (${penaltyAmount.toFixed(1)} points)`);
        
        // Enviar notificación sobre penalización
        await this.notifyLatePenalty(submission, assignment, analysis);
      }

      return penalizedGrade;

    } catch (error) {
      console.error('❌ [LateSubmission] Error applying late penalty:', error);
      return originalGrade; // En caso de error, devolver calificación original
    }
  }

  /**
   * Validar si una submission puede ser enviada
   */
  canSubmit(assignment: Assignment, currentDate?: Date): {
    can_submit: boolean;
    reason?: string;
    hours_until_deadline?: number;
    days_past_deadline?: number;
  } {
    const now = currentDate || new Date();
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
    
    if (!dueDate) {
      return { can_submit: true };
    }

    const policy = this.getAssignmentPolicy(assignment);
    const timeDiffMs = now.getTime() - dueDate.getTime();
    
    // Antes del deadline
    if (timeDiffMs < 0) {
      return {
        can_submit: true,
        hours_until_deadline: Math.abs(timeDiffMs) / (1000 * 60 * 60)
      };
    }

    // En período de gracia
    if (timeDiffMs <= policy.grace_period_hours * 60 * 60 * 1000) {
      return {
        can_submit: true,
        reason: `Período de gracia activo (${policy.grace_period_hours}h)`
      };
    }

    // Después del deadline
    if (!policy.allow_late_submissions) {
      return {
        can_submit: false,
        reason: 'Las submissions tardías no están permitidas',
        days_past_deadline: Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24))
      };
    }

    const daysLate = Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24));
    
    if (daysLate > policy.max_late_days) {
      return {
        can_submit: false,
        reason: `Plazo excedido (máximo ${policy.max_late_days} días tarde)`,
        days_past_deadline: daysLate
      };
    }

    return {
      can_submit: true,
      reason: `Submission tardía permitida con ${policy.late_penalty_per_day}% de penalización por día`,
      days_past_deadline: daysLate
    };
  }

  /**
   * Obtener estadísticas de submissions tardías
   */
  async getLateSubmissionStats(assignments: Assignment[]): Promise<{
    total_assignments: number;
    late_submissions: number;
    on_time_submissions: number;
    average_days_late: number;
    total_penalty_applied: number;
    most_problematic_assignments: Array<{
      assignment_title: string;
      late_percentage: number;
      average_penalty: number;
    }>;
  }> {
    // En implementación real, esto vendría del backend
    // Simulamos datos para demostración
    
    const stats = {
      total_assignments: assignments.length,
      late_submissions: 23,
      on_time_submissions: 156,
      average_days_late: 2.3,
      total_penalty_applied: 15.7,
      most_problematic_assignments: [
        { assignment_title: 'Proyecto Final', late_percentage: 35.2, average_penalty: 8.5 },
        { assignment_title: 'Análisis de Datos', late_percentage: 28.7, average_penalty: 12.3 },
        { assignment_title: 'Investigación', late_percentage: 15.8, average_penalty: 5.2 }
      ]
    };

    console.log('📊 [LateSubmission] Late submission stats calculated:', stats);
    return stats;
  }

  /**
   * Calcular penalización basada en días tarde y política
   */
  private calculatePenalty(daysLate: number, policy: LateSubmissionPolicy): number {
    if (daysLate <= 0) return 0;
    
    const totalPenalty = daysLate * policy.late_penalty_per_day;
    return Math.min(totalPenalty, policy.max_late_penalty);
  }

  /**
   * Obtener política de late submission para un assignment
   */
  private getAssignmentPolicy(assignment: Assignment): LateSubmissionPolicy {
    // En implementación real, esto podría venir de assignment.late_submission_policy
    return {
      allow_late_submissions: assignment.accept_late_submissions ?? this.defaultPolicy.allow_late_submissions,
      late_penalty_per_day: assignment.late_penalty_per_day ?? this.defaultPolicy.late_penalty_per_day,
      max_late_penalty: this.defaultPolicy.max_late_penalty, // No existe en Assignment, usar default
      max_late_days: this.defaultPolicy.max_late_days, // No existe en Assignment, usar default
      grace_period_hours: this.defaultPolicy.grace_period_hours // No existe en Assignment, usar default
    };
  }

  /**
   * Enviar notificación sobre penalización aplicada
   */
  private async notifyLatePenalty(
    submission: AssignmentSubmission,
    assignment: Assignment,
    analysis: LateSubmissionAnalysis
  ): Promise<void> {
    try {
      const message = `Tu submission para "${assignment.title}" fue enviada ${analysis.days_late} días tarde. ` +
        `Se ha aplicado una penalización del ${analysis.penalty_percentage}% a tu calificación.`;

      // Usar el servicio de notificaciones de assignments
      await assignmentNotificationService.notifyRevisionRequested(
        submission,
        assignment,
        message
      );

    } catch (error) {
      console.error('❌ [LateSubmission] Error sending penalty notification:', error);
    }
  }

  /**
   * Generar reporte de submissions tardías para instructores
   */
  generateLateSubmissionReport(
    assignments: Assignment[],
    submissions: AssignmentSubmission[]
  ): {
    summary: {
      total_late: number;
      total_penalty_points: number;
      average_penalty_percentage: number;
    };
    by_assignment: Array<{
      assignment_title: string;
      total_submissions: number;
      late_submissions: number;
      late_percentage: number;
      average_days_late: number;
      total_penalty_applied: number;
    }>;
    by_student: Array<{
      student_name: string;
      late_submissions: number;
      total_penalty_percentage: number;
      needs_intervention: boolean;
    }>;
  } {
    const lateSubmissions = (Array.isArray(submissions) ? submissions : []).filter(s => {
      const assignment = assignments.find(a => a.id === s.assignment_id);
      if (!assignment) return false;
      
      const analysis = this.analyzeSubmission(assignment, s, 
        s.submitted_at ? new Date(s.submitted_at) : new Date()
      );
      return analysis.is_late;
    });

    const totalPenaltyPoints = lateSubmissions.reduce((sum, s) => {
      const assignment = assignments.find(a => a.id === s.assignment_id);
      if (!assignment || !s.total_points_earned) return sum;
      
      const analysis = this.analyzeSubmission(assignment, s, 
        s.submitted_at ? new Date(s.submitted_at) : new Date()
      );
      return sum + (s.total_points_earned - (analysis.penalized_grade || 0));
    }, 0);

    // Generar datos por assignment
    const byAssignment = assignments.map(assignment => {
      const assignmentSubmissions = (Array.isArray(submissions) ? submissions : []).filter(s => s.assignment_id === assignment.id);
      const lateAssignmentSubmissions = (Array.isArray(assignmentSubmissions) ? assignmentSubmissions : []).filter(s => {
        const analysis = this.analyzeSubmission(assignment, s, 
          s.submitted_at ? new Date(s.submitted_at) : new Date()
        );
        return analysis.is_late;
      });

      const totalDaysLate = lateAssignmentSubmissions.reduce((sum, s) => {
        const analysis = this.analyzeSubmission(assignment, s,
          s.submitted_at ? new Date(s.submitted_at) : new Date()
        );
        return sum + analysis.days_late;
      }, 0);

      return {
        assignment_title: assignment.title,
        total_submissions: assignmentSubmissions.length,
        late_submissions: lateAssignmentSubmissions.length,
        late_percentage: assignmentSubmissions.length > 0 ? 
          (lateAssignmentSubmissions.length / assignmentSubmissions.length) * 100 : 0,
        average_days_late: lateAssignmentSubmissions.length > 0 ? 
          totalDaysLate / lateAssignmentSubmissions.length : 0,
        total_penalty_applied: lateAssignmentSubmissions.reduce((sum, s) => {
          const analysis = this.analyzeSubmission(assignment, s,
            s.submitted_at ? new Date(s.submitted_at) : new Date()
          );
          return sum + analysis.penalty_percentage;
        }, 0)
      };
    });

    // Generar datos por estudiante
    const studentData = new Map<string, {
      student_name: string;
      late_count: number;
      total_penalty: number;
    }>();

    lateSubmissions.forEach(s => {
      const studentName = s.student_name || 'Unknown';
      const current = studentData.get(studentName) || {
        student_name: studentName,
        late_count: 0,
        total_penalty: 0
      };
      
      const assignment = assignments.find(a => a.id === s.assignment_id);
      if (assignment) {
        const analysis = this.analyzeSubmission(assignment, s,
          s.submitted_at ? new Date(s.submitted_at) : new Date()
        );
        current.late_count++;
        current.total_penalty += analysis.penalty_percentage;
      }
      
      studentData.set(studentName, current);
    });

    const byStudent = Array.from(studentData.values()).map(data => ({
      student_name: data.student_name,
      late_submissions: data.late_count,
      total_penalty_percentage: data.total_penalty,
      needs_intervention: data.late_count >= 3 || data.total_penalty >= 30 // Criterios de intervención
    }));

    return {
      summary: {
        total_late: lateSubmissions.length,
        total_penalty_points: totalPenaltyPoints,
        average_penalty_percentage: lateSubmissions.length > 0 ?
          lateSubmissions.reduce((sum, s) => {
            const assignment = assignments.find(a => a.id === s.assignment_id);
            if (!assignment) return sum;
            const analysis = this.analyzeSubmission(assignment, s,
              s.submitted_at ? new Date(s.submitted_at) : new Date()
            );
            return sum + analysis.penalty_percentage;
          }, 0) / lateSubmissions.length : 0
      },
      by_assignment: byAssignment,
      by_student: byStudent
    };
  }
}

export const lateSubmissionService = new LateSubmissionService();
export default lateSubmissionService;
