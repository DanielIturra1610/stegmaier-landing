/**
 * Componente principal para la entrega de assignments por estudiantes
 * Integra editor de texto y upload de archivos múltiples
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  Info,
  Send,
  RotateCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { assignmentService } from '../../services/assignmentService';
import { FileUploader } from './FileUploader';
import {
  Assignment,
  AssignmentSubmission,
  AssignmentSubmissionProps,
  SubmissionStatus,
  AssignmentFile
} from '../../types/assignment';

export const AssignmentSubmissionComponent: React.FC<AssignmentSubmissionProps> = ({
  assignment,
  existingSubmission,
  onSubmissionUpdate,
  onError
}) => {
  // State management
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(existingSubmission || null);
  const [textContent, setTextContent] = useState(existingSubmission?.text_content || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<AssignmentFile[]>(existingSubmission?.files || []);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Refs
  const fileUploaderRef = useRef<any>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing submission on mount
  useEffect(() => {
    loadSubmission();
  }, [assignment.id]);

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges && submission) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [textContent, hasUnsavedChanges]);

  const loadSubmission = async () => {
    try {
      setIsLoading(true);
      const existingSubmission = await assignmentService.getMySubmission(assignment.id);
      
      if (existingSubmission) {
        setSubmission(existingSubmission);
        setTextContent(existingSubmission.text_content);
        setUploadedFiles(existingSubmission.files);
      }
    } catch (error: any) {
      console.error('Error loading submission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSave = async () => {
    if (!submission) return;

    try {
      await assignmentService.updateSubmission(submission.id, {
        text_content: textContent,
        status: SubmissionStatus.IN_PROGRESS
      });
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContent(e.target.value);
    setHasUnsavedChanges(true);
  }, []);

  const handleCreateSubmission = async () => {
    try {
      setIsLoading(true);
      const newSubmission = await assignmentService.createSubmission({
        assignment_id: assignment.id,
        text_content: textContent,
        is_final: false
      });
      
      setSubmission(newSubmission);
      onSubmissionUpdate?.(newSubmission);
      setHasUnsavedChanges(false);
    } catch (error: any) {
      onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!submission) {
      await handleCreateSubmission();
      return;
    }

    try {
      setIsSaving(true);
      const updatedSubmission = await assignmentService.updateSubmission(submission.id, {
        text_content: textContent,
        status: SubmissionStatus.IN_PROGRESS
      });
      
      setSubmission(updatedSubmission);
      onSubmissionUpdate?.(updatedSubmission);
      setHasUnsavedChanges(false);
    } catch (error: any) {
      onError?.(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!submission) {
      await handleCreateSubmission();
      if (!submission) return;
    }

    try {
      setIsLoading(true);
      
      // First upload any pending files
      if (fileUploaderRef.current && fileUploaderRef.current.uploadAllFiles) {
        await fileUploaderRef.current.uploadAllFiles(submission.id);
      }
      
      // Then submit the assignment
      const submittedAssignment = await assignmentService.submitAssignment(submission.id);
      setSubmission(submittedAssignment);
      onSubmissionUpdate?.(submittedAssignment);
      setHasUnsavedChanges(false);
    } catch (error: any) {
      onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesUploaded = useCallback((files: AssignmentFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  }, []);

  const handleUploadError = useCallback((error: string) => {
    onError?.(error);
  }, [onError]);

  const removeFile = async (fileId: string) => {
    if (!submission) return;

    try {
      await assignmentService.deleteSubmissionFile(submission.id, fileId);
      setUploadedFiles(prev => (Array.isArray(prev) ? prev : []).filter(f => f.id !== fileId));
    } catch (error: any) {
      onError?.(error.message);
    }
  };

  // Calculate remaining time
  const getRemainingTime = () => {
    if (!assignment.due_date) return null;
    
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const diff = dueDate.getTime() - now.getTime();
    
    if (diff < 0) return 'Vencido';
    
    return assignmentService.formatTimeUntilDue(assignment.due_date);
  };

  const isSubmitted = submission?.status === SubmissionStatus.SUBMITTED || 
                     submission?.status === SubmissionStatus.GRADED;
  const isOverdue = assignment.is_overdue && !isSubmitted;
  const canSubmit = submission && (textContent.trim() || uploadedFiles.length > 0);
  const remainingTime = getRemainingTime();

  if (isLoading && !submission) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Cargando assignment...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Assignment Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{assignment.title}</h2>
              <p className="mt-2 text-muted-foreground">{assignment.description}</p>
            </div>

            <div className="flex items-center space-x-2">
              {remainingTime && (
                <Badge variant={isOverdue ? "destructive" : "secondary"} className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {remainingTime}
                </Badge>
              )}

              {submission && (
                <Badge variant="outline" className={assignmentService.getStatusColor(submission.status)}>
                  {assignmentService.getStatusLabel(submission.status)}
                </Badge>
              )}
            </div>
          </div>

          {/* Assignment Details */}
          {assignment.instructions && (
            <Alert className="mt-4 border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Instrucciones</AlertTitle>
              <AlertDescription className="text-blue-800 whitespace-pre-wrap">
                {assignment.instructions}
              </AlertDescription>
            </Alert>
          )}

          {/* Assignment Requirements */}
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-gray-900">Puntos máximos:</span>
              <span className="ml-2">{assignment.max_points}</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Archivos máximos:</span>
              <span className="ml-2">{assignment.max_files}</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Tamaño máximo:</span>
              <span className="ml-2">{assignmentService.formatFileSize(assignment.max_file_size)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission Status Warning */}
      {isSubmitted && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Assignment Enviado</AlertTitle>
          <AlertDescription className="text-green-700">
            Tu assignment ha sido enviado exitosamente. Ya no puedes realizar cambios.
            {submission?.submitted_at && (
              <span className="block mt-1">
                Enviado el: {new Date(submission.submitted_at).toLocaleString()}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isOverdue && !isSubmitted && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Assignment Vencido</AlertTitle>
          <AlertDescription>
            La fecha límite ha pasado. Las entregas tardías pueden tener penalización.
            {assignment.late_penalty_per_day > 0 && (
              <span className="block mt-1">
                Penalización: {(assignment.late_penalty_per_day * 100).toFixed(0)}% por día
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Text Editor Section */}
      {!isSubmitted && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Respuesta de Texto
              </CardTitle>
              <div className="flex items-center space-x-2">
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    ● Cambios sin guardar
                  </Badge>
                )}
                {isSaving && (
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    Guardando...
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <Textarea
              value={textContent}
              onChange={handleTextChange}
              placeholder="Escribe tu respuesta aquí..."
              className="min-h-[16rem] resize-y"
              disabled={isSubmitted}
            />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{textContent.length} caracteres</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar borrador'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Upload Section */}
      {!isSubmitted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Archivos Adjuntos
            </CardTitle>
          </CardHeader>

          <CardContent>
            <FileUploader
              ref={fileUploaderRef}
              onFilesUploaded={handleFilesUploaded}
              onUploadError={handleUploadError}
              maxFiles={assignment.max_files}
              maxFileSize={assignment.max_file_size}
              allowedTypes={assignment.allowed_file_types}
            />
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Archivos Enviados ({uploadedFiles.length})
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.original_filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {assignmentService.formatFileSize(file.file_size)}
                      {file.description && ` • ${file.description}`}
                    </p>
                  </div>
                </div>

                {!isSubmitted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!isSubmitted && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {assignment.allow_multiple_submissions
                  ? 'Puedes enviar múltiples veces hasta la fecha límite'
                  : 'Solo puedes enviar una vez'
                }
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isSaving}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Guardar Borrador
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Assignment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssignmentSubmissionComponent;
