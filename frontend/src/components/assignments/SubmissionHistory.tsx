/**
 * Componente para mostrar historial de entregas con versioning
 * Permite ver todas las versiones de submissions de un assignment
 */
import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  DocumentTextIcon,
  CloudArrowDownIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { assignmentService } from '../../services/assignmentService';
import {
  Assignment,
  AssignmentSubmission,
  SubmissionHistoryProps,
  SubmissionStatus,
  GradeStatus
} from '../../types/assignment';

interface SubmissionVersion {
  submission: AssignmentSubmission;
  isLatest: boolean;
  versionNumber: number;
  changes: string[];
}

export const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
  submissions: initialSubmissions,
  assignment,
  studentView = false
}) => {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(initialSubmissions);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Group submissions by student
  const studentSubmissions = React.useMemo(() => {
    const grouped = submissions.reduce((acc, submission) => {
      const key = submission.student_id;
      if (!acc[key]) {
        acc[key] = {
          studentId: submission.student_id,
          studentName: submission.student_name || `Estudiante ${submission.student_id}`,
          submissions: []
        };
      }
      acc[key].submissions.push(submission);
      return acc;
    }, {} as Record<string, { studentId: string; studentName: string; submissions: AssignmentSubmission[] }>);

    // Sort submissions by submission number for each student
    Object.values(grouped).forEach(student => {
      student.submissions.sort((a, b) => b.submission_number - a.submission_number);
    });

    return grouped;
  }, [submissions]);

  const getSubmissionVersions = (studentSubmissions: AssignmentSubmission[]): SubmissionVersion[] => {
    return studentSubmissions.map((submission, index) => {
      const isLatest = index === 0;
      const versionNumber = submission.submission_number;
      
      // Compare with previous version to identify changes
      let changes: string[] = [];
      if (index < studentSubmissions.length - 1) {
        const previous = studentSubmissions[index + 1];
        
        if (submission.text_content !== previous.text_content) {
          changes.push('Contenido de texto modificado');
        }
        
        if (submission.files.length !== previous.files.length) {
          const diff = submission.files.length - previous.files.length;
          changes.push(diff > 0 
            ? `${diff} archivo${diff > 1 ? 's' : ''} agregado${diff > 1 ? 's' : ''}`
            : `${Math.abs(diff)} archivo${Math.abs(diff) > 1 ? 's' : ''} eliminado${Math.abs(diff) > 1 ? 's' : ''}`
          );
        }
        
        if (submission.status !== previous.status) {
          changes.push(`Estado cambió a ${assignmentService.getStatusLabel(submission.status)}`);
        }
      } else {
        changes.push('Versión inicial');
      }

      return {
        submission,
        isLatest,
        versionNumber,
        changes
      };
    });
  };

  const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.SUBMITTED:
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case SubmissionStatus.IN_PROGRESS:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case SubmissionStatus.GRADED:
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case SubmissionStatus.RETURNED:
        return <XMarkIcon className="h-5 w-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGradeInfo = (submission: AssignmentSubmission) => {
    if (submission.grade_status === GradeStatus.COMPLETED) {
      const letterGrade = assignmentService.calculateLetterGrade(submission.percentage_grade);
      return {
        hasGrade: true,
        points: `${submission.total_points_earned}/${submission.total_points_possible}`,
        percentage: `${submission.percentage_grade.toFixed(1)}%`,
        letter: letterGrade,
        isPassing: submission.is_passing
      };
    }
    return { hasGrade: false };
  };

  const filteredStudents = selectedStudent === 'all' 
    ? Object.values(studentSubmissions)
    : [studentSubmissions[selectedStudent]].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Historial de Entregas</h2>
            <p className="text-sm text-gray-600 mt-1">
              {assignment.title} - Versiones y modificaciones
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Student Filter (for instructor view) */}
            {!studentView && Object.keys(studentSubmissions).length > 1 && (
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estudiantes</option>
                  {Object.values(studentSubmissions).map((student) => (
                    <option key={student.studentId} value={student.studentId}>
                      {student.studentName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="text-sm text-gray-500">
              {submissions.length} entrega{submissions.length !== 1 ? 's' : ''} total{submissions.length !== 1 ? 'es' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Submissions by Student */}
      <div className="space-y-6">
        {filteredStudents.map((student) => {
          const versions = getSubmissionVersions(student.submissions);
          
          return (
            <div key={student.studentId} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Student Header */}
              {!studentView && (
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{student.studentName}</h3>
                        <p className="text-sm text-gray-600">
                          {student.submissions.length} versión{student.submissions.length !== 1 ? 'es' : ''}
                        </p>
                      </div>
                    </div>
                    
                    {/* Latest submission status */}
                    {versions.length > 0 && (
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignmentService.getStatusColor(versions[0].submission.status)
                        }`}>
                          {assignmentService.getStatusLabel(versions[0].submission.status)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Versions Timeline */}
              <div className="p-6">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {versions.map((version, versionIndex) => {
                      const isExpanded = expandedSubmission === version.submission.id;
                      const gradeInfo = getGradeInfo(version.submission);
                      
                      return (
                        <li key={version.submission.id}>
                          <div className="relative pb-8">
                            {/* Timeline line */}
                            {versionIndex !== versions.length - 1 && (
                              <span 
                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true" 
                              />
                            )}
                            
                            <div className="relative flex space-x-3">
                              {/* Timeline icon */}
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-gray-300">
                                {getStatusIcon(version.submission.status)}
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <p className="text-sm font-medium text-gray-900">
                                      Versión {version.versionNumber}
                                      {version.isLatest && (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          Actual
                                        </span>
                                      )}
                                    </p>
                                    
                                    {version.submission.is_late && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <ClockIcon className="h-3 w-3 mr-1" />
                                        Tardía
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    {gradeInfo.hasGrade && (
                                      <div className={`text-sm font-medium ${
                                        gradeInfo.isPassing ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {gradeInfo.points} ({gradeInfo.percentage} - {gradeInfo.letter})
                                      </div>
                                    )}
                                    
                                    <button
                                      onClick={() => setExpandedSubmission(isExpanded ? null : version.submission.id)}
                                      className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                      {isExpanded ? (
                                        <ChevronDownIcon className="h-5 w-5" />
                                      ) : (
                                        <ChevronRightIcon className="h-5 w-5" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="mt-1">
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span className="flex items-center">
                                      <CalendarIcon className="h-4 w-4 mr-1" />
                                      {version.submission.submitted_at 
                                        ? formatDateTime(version.submission.submitted_at)
                                        : 'Guardado: ' + formatDateTime(version.submission.last_modified_at)
                                      }
                                    </span>
                                    
                                    {version.submission.files.length > 0 && (
                                      <span>{version.submission.files.length} archivo{version.submission.files.length !== 1 ? 's' : ''}</span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Changes summary */}
                                <div className="mt-2">
                                  <div className="flex flex-wrap gap-1">
                                    {version.changes.map((change, changeIndex) => (
                                      <span
                                        key={changeIndex}
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                      >
                                        <TagIcon className="h-3 w-3 mr-1" />
                                        {change}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* Expanded content */}
                                {isExpanded && (
                                  <div className="mt-4 border-t border-gray-200 pt-4">
                                    <div className="space-y-4">
                                      {/* Text content */}
                                      {version.submission.text_content && (
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-700 mb-2">Contenido de texto:</h4>
                                          <div className="bg-gray-50 p-3 rounded-md text-sm">
                                            {version.submission.text_content}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Files */}
                                      {version.submission.files.length > 0 && (
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-700 mb-2">Archivos:</h4>
                                          <div className="space-y-2">
                                            {version.submission.files.map((file) => (
                                              <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                                <div className="flex items-center space-x-2">
                                                  <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                                                  <span className="text-sm">{file.original_filename}</span>
                                                  <span className="text-xs text-gray-500">
                                                    ({assignmentService.formatFileSize(file.file_size)})
                                                  </span>
                                                </div>
                                                <button className="text-blue-600 hover:text-blue-800 text-sm">
                                                  <CloudArrowDownIcon className="h-4 w-4" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Grade details */}
                                      {gradeInfo.hasGrade && (
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-700 mb-2">Calificación:</h4>
                                          <div className="bg-gray-50 p-3 rounded-md">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-sm">Puntos obtenidos:</span>
                                              <span className="font-medium">{gradeInfo.points}</span>
                                            </div>
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-sm">Porcentaje:</span>
                                              <span className="font-medium">{gradeInfo.percentage}</span>
                                            </div>
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-sm">Calificación literal:</span>
                                              <span className={`font-medium ${gradeInfo.isPassing ? 'text-green-600' : 'text-red-600'}`}>
                                                {gradeInfo.letter}
                                              </span>
                                            </div>
                                            {version.submission.penalty_applied > 0 && (
                                              <div className="flex items-center justify-between text-red-600">
                                                <span className="text-sm">Penalización por tardanza:</span>
                                                <span className="font-medium">-{version.submission.penalty_applied.toFixed(1)}%</span>
                                              </div>
                                            )}
                                          </div>
                                          
                                          {version.submission.instructor_feedback && (
                                            <div className="mt-3">
                                              <h5 className="text-sm font-medium text-gray-700 mb-1">Feedback del instructor:</h5>
                                              <div className="bg-blue-50 p-3 rounded-md text-sm">
                                                {version.submission.instructor_feedback}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Comments */}
                                      {version.submission.comments.length > 0 && (
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-700 mb-2">Comentarios:</h4>
                                          <div className="space-y-2">
                                            {version.submission.comments.map((comment) => (
                                              <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
                                                <div className="flex items-center justify-between mb-1">
                                                  <span className="text-sm font-medium">
                                                    {comment.author_name} ({comment.author_role})
                                                  </span>
                                                  <span className="text-xs text-gray-500">
                                                    {formatDateTime(comment.created_at)}
                                                  </span>
                                                </div>
                                                <p className="text-sm text-gray-700">{comment.content}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
        
        {filteredStudents.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay entregas</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedStudent === 'all' 
                ? 'No se han realizado entregas para este assignment.'
                : 'El estudiante seleccionado no ha realizado entregas.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionHistory;
