/**
 * Servicio para exportación de calificaciones en formatos CSV y Excel
 * Genera reportes detallados de assignments y calificaciones
 */
import { Assignment, AssignmentSubmission } from '../types/assignment';
import { assignmentService } from './assignmentService';

interface GradeExportData {
  student_name: string;
  student_email: string;
  assignment_title: string;
  grade: number | null;
  max_points: number;
  percentage: number | null;
  status: string;
  submitted_at: string | null;
  graded_at: string | null;
  feedback: string;
  days_late: number | null;
  penalty_applied: number | null;
}

interface ExportOptions {
  format: 'csv' | 'excel';
  includeDetails: boolean;
  includeFeedback: boolean;
  includeStats: boolean;
}

class GradeExportService {
  /**
   * Exportar calificaciones de un assignment específico
   */
  async exportAssignmentGrades(
    assignment: Assignment,
    submissions: AssignmentSubmission[],
    options: ExportOptions
  ): Promise<void> {
    try {
      console.log(' [GradeExport] Exporting grades for assignment:', assignment.title);
      
      const exportData = this.prepareExportData(assignment, submissions, options);
      
      if (options.format === 'csv') {
        this.downloadCSV(exportData, `${assignment.title}_calificaciones.csv`);
      } else {
        this.downloadExcel(exportData, assignment, `${assignment.title}_calificaciones.xlsx`);
      }
      
      console.log(' [GradeExport] Export completed successfully');
      
    } catch (error) {
      console.error(' [GradeExport] Error exporting grades:', error);
      throw error;
    }
  }

  /**
   * Exportar calificaciones de todo un curso
   */
  async exportCourseGrades(
    courseId: string,
    options: ExportOptions
  ): Promise<void> {
    try {
      console.log('📊 [GradeExport] Exporting course grades for:', courseId);
      
      // Obtener todos los assignments del curso
      const assignments = await assignmentService.getCourseAssignments(courseId);
      
      const allExportData: GradeExportData[] = [];
      
      for (const assignment of assignments) {
        const submissions = await assignmentService.getAssignmentSubmissions(assignment.id);
        const assignmentData = this.prepareExportData(assignment, submissions, options);
        allExportData.push(...assignmentData);
      }
      
      if (options.format === 'csv') {
        this.downloadCSV(allExportData, `curso_${courseId}_calificaciones.csv`);
      } else {
        this.downloadCourseExcel(allExportData, assignments, `curso_${courseId}_calificaciones.xlsx`);
      }
      
      console.log('✅ [GradeExport] Course export completed successfully');
      
    } catch (error) {
      console.error('❌ [GradeExport] Error exporting course grades:', error);
      throw error;
    }
  }

  /**
   * Preparar datos para exportación
   */
  private prepareExportData(
    assignment: Assignment,
    submissions: AssignmentSubmission[],
    options: ExportOptions
  ): GradeExportData[] {
    return submissions.map(submission => {
      // Obtener la calificación final del array de grades
      const finalGrade = submission.grades.length > 0 
        ? submission.grades[submission.grades.length - 1]
        : null;
      
      const gradeValue = finalGrade?.points_earned || null;
      const percentage = gradeValue !== null 
        ? Math.round((gradeValue / assignment.max_points) * 100)
        : null;
      
      // Usar datos de submission para días de retraso
      const daysLate = submission.is_late ? submission.days_late : null;
      const penaltyApplied = submission.penalty_applied || null;

      return {
        student_name: submission.student_name || 'N/A',
        student_email: `student-${submission.student_id}@example.com`, // En real vendría del backend
        assignment_title: assignment.title,
        grade: gradeValue,
        max_points: assignment.max_points,
        percentage,
        status: this.getStatusText(submission.status),
        submitted_at: submission.submitted_at || null,
        graded_at: finalGrade?.graded_at || null,
        feedback: options.includeFeedback ? submission.instructor_feedback : '',
        days_late: daysLate,
        penalty_applied: penaltyApplied
      };
    });
  }

  /**
   * Descargar archivo CSV
   */
  private downloadCSV(data: GradeExportData[], filename: string): void {
    const headers = [
      'Estudiante',
      'Email',
      'Assignment',
      'Calificación',
      'Puntos Máximos',
      'Porcentaje',
      'Estado',
      'Fecha Envío',
      'Fecha Calificación',
      'Días de Retraso',
      'Penalización Aplicada'
    ];

    if (data.length > 0 && data[0].feedback) {
      headers.push('Feedback');
    }

    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        this.escapeCSV(row.student_name),
        this.escapeCSV(row.student_email),
        this.escapeCSV(row.assignment_title),
        row.grade || '',
        row.max_points,
        row.percentage ? `${row.percentage}%` : '',
        this.escapeCSV(row.status),
        row.submitted_at ? new Date(row.submitted_at).toLocaleDateString('es-ES') : '',
        row.graded_at ? new Date(row.graded_at).toLocaleDateString('es-ES') : '',
        row.days_late || '',
        row.penalty_applied ? `${row.penalty_applied}%` : '',
        ...(row.feedback ? [this.escapeCSV(row.feedback)] : [])
      ].join(','))
    ].join('\n');

    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Descargar archivo Excel (simulado como CSV mejorado)
   */
  private downloadExcel(
    data: GradeExportData[], 
    assignment: Assignment, 
    filename: string
  ): void {
    // En una implementación real, usaríamos una librería como xlsx o exceljs
    // Por ahora, generamos un CSV con formato mejorado
    
    const stats = this.calculateStats(data);
    
    const content = [
      `REPORTE DE CALIFICACIONES - ${assignment.title}`,
      `Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`,
      `Total de estudiantes: ${data.length}`,
      `Calificaciones completadas: ${stats.graded}`,
      `Promedio: ${stats.average.toFixed(2)}`,
      `Calificación más alta: ${stats.highest}`,
      `Calificación más baja: ${stats.lowest}`,
      '',
      'DETALLE DE CALIFICACIONES',
      ''
    ];

    // Agregar CSV de datos
    content.push(...this.generateCSVLines(data));

    this.downloadFile(content.join('\n'), filename, 'application/vnd.ms-excel');
  }

  /**
   * Descargar Excel para curso completo
   */
  private downloadCourseExcel(
    data: GradeExportData[], 
    assignments: Assignment[], 
    filename: string
  ): void {
    const content = [
      `REPORTE DE CALIFICACIONES DEL CURSO`,
      `Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`,
      `Total de assignments: ${assignments.length}`,
      `Total de submissions: ${data.length}`,
      '',
      'RESUMEN POR ASSIGNMENT',
      ''
    ];

    // Resumen por assignment
    assignments.forEach(assignment => {
      const assignmentData = data.filter(d => d.assignment_title === assignment.title);
      const stats = this.calculateStats(assignmentData);
      
      content.push(`${assignment.title}:`);
      content.push(`  Submissions: ${assignmentData.length}`);
      content.push(`  Calificadas: ${stats.graded}`);
      content.push(`  Promedio: ${stats.average.toFixed(2)}`);
      content.push('');
    });

    content.push('DETALLE COMPLETO');
    content.push('');
    content.push(...this.generateCSVLines(data));

    this.downloadFile(content.join('\n'), filename, 'application/vnd.ms-excel');
  }

  /**
   * Generar líneas CSV
   */
  private generateCSVLines(data: GradeExportData[]): string[] {
    const headers = [
      'Estudiante',
      'Email',
      'Assignment',
      'Calificación',
      'Puntos Máximos',
      'Porcentaje',
      'Estado',
      'Fecha Envío',
      'Fecha Calificación',
      'Días de Retraso',
      'Penalización',
      'Feedback'
    ];

    return [
      headers.join(','),
      ...data.map(row => [
        this.escapeCSV(row.student_name),
        this.escapeCSV(row.student_email),
        this.escapeCSV(row.assignment_title),
        row.grade || '',
        row.max_points,
        row.percentage ? `${row.percentage}%` : '',
        this.escapeCSV(row.status),
        row.submitted_at ? new Date(row.submitted_at).toLocaleDateString('es-ES') : '',
        row.graded_at ? new Date(row.graded_at).toLocaleDateString('es-ES') : '',
        row.days_late || '',
        row.penalty_applied ? `${row.penalty_applied}%` : '',
        this.escapeCSV(row.feedback)
      ].join(','))
    ];
  }

  /**
   * Calcular estadísticas
   */
  private calculateStats(data: GradeExportData[]) {
    const gradedData = data.filter(d => d.grade !== null);
    const grades = gradedData.map(d => d.grade!);
    
    return {
      total: data.length,
      graded: gradedData.length,
      average: grades.length > 0 ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : 0,
      highest: grades.length > 0 ? Math.max(...grades) : 0,
      lowest: grades.length > 0 ? Math.min(...grades) : 0
    };
  }

  /**
   * Escapar texto para CSV
   */
  private escapeCSV(text: string): string {
    if (!text) return '';
    
    // Si contiene comas, saltos de línea o comillas, envolver en comillas
    if (text.includes(',') || text.includes('\n') || text.includes('"')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    
    return text;
  }

  /**
   * Obtener texto de estado
   */
  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'not_started': 'No iniciado',
      'in_progress': 'En progreso',
      'submitted': 'Enviado',
      'graded': 'Calificado',
      'returned': 'Devuelto'
    };
    
    return statusMap[status] || status;
  }

  /**
   * Descargar archivo
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob(['\uFEFF' + content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }

  /**
   * Exportar plantilla para calificaciones masivas
   */
  async exportGradingTemplate(assignment: Assignment, submissions: AssignmentSubmission[]): Promise<void> {
    try {
      console.log('📋 [GradeExport] Exporting grading template for:', assignment.title);
      
      const templateData = submissions.map(submission => [
        submission.student_name || 'N/A',
        `student-${submission.student_id}@example.com`, // Email generado desde student_id
        submission.id,
        '', // Grade (to be filled)
        '', // Feedback (to be filled)
        assignment.max_points
      ]);

      const content = [
        '# PLANTILLA DE CALIFICACIÓN MASIVA',
        `# Assignment: ${assignment.title}`,
        `# Puntos máximos: ${assignment.max_points}`,
        '# INSTRUCCIONES: Complete las columnas "Calificación" y "Feedback", luego importe este archivo',
        '',
        'Estudiante,Email,ID Submission,Calificación,Feedback,Puntos Máximos',
        ...templateData.map(row => row.join(','))
      ].join('\n');

      this.downloadFile(content, `${assignment.title}_plantilla_calificacion.csv`, 'text/csv;charset=utf-8;');
      
      console.log('✅ [GradeExport] Template exported successfully');
      
    } catch (error) {
      console.error('❌ [GradeExport] Error exporting template:', error);
      throw error;
    }
  }

  /**
   * Importar calificaciones desde CSV
   */
  async importGradesFromCSV(file: File): Promise<{ submissionId: string; grade: number; feedback: string }[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim() && !line.startsWith('#'));
          const headers = lines[0].split(',');
          
          const grades = lines.slice(1).map(line => {
            const values = line.split(',');
            return {
              submissionId: values[2]?.trim(),
              grade: parseFloat(values[3]?.trim()) || 0,
              feedback: values[4]?.trim() || ''
            };
          }).filter(g => g.submissionId && !isNaN(g.grade));
          
          resolve(grades);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  }
}

export const gradeExportService = new GradeExportService();
export default gradeExportService;
