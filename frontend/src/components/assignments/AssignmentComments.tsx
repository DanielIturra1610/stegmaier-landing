/**
 * Sistema de comentarios bidireccional para assignments
 * Permite conversaciones entre instructores y estudiantes sobre submissions
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { assignmentService } from '../../services/assignmentService';
import { notificationService } from '../../services/notificationService';

interface Comment {
  id: string;
  submission_id: string;
  user_id: string;
  user_name: string;
  user_role: 'student' | 'instructor' | 'admin';
  message: string;
  created_at: string;
  is_revision_request?: boolean;
  is_instructor_only?: boolean;
}

interface AssignmentCommentsProps {
  submissionId: string;
  assignmentId: string;
  courseId: string;
  isInstructor?: boolean;
  onRevisionRequested?: () => void;
  onNewComment?: (comment: Comment) => void;
}

export const AssignmentComments: React.FC<AssignmentCommentsProps> = ({
  submissionId,
  assignmentId,
  courseId,
  isInstructor = false,
  onRevisionRequested,
  onNewComment
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevisionRequest, setIsRevisionRequest] = useState(false);
  const [isInstructorOnly, setIsInstructorOnly] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadComments();
  }, [submissionId]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const loadComments = async () => {
    try {
      console.log('💬 [AssignmentComments] Loading comments for submission:', submissionId);
      
      // Simular llamada API para obtener comentarios
      // const comments = await assignmentService.getSubmissionComments(submissionId);
      
      // Por ahora, datos de ejemplo
      const mockComments: Comment[] = [
        {
          id: '1',
          submission_id: submissionId,
          user_id: 'instructor-1',
          user_name: 'Prof. García',
          user_role: 'instructor',
          message: 'Buen trabajo en general. Sin embargo, necesitas revisar la sección 2 donde...',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          submission_id: submissionId,
          user_id: user?.id || 'student-1',
          user_name: user?.full_name || 'Estudiante',
          user_role: 'student',
          message: 'Gracias por el feedback. ¿Podrías ser más específico sobre qué cambios necesito hacer?',
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        }
      ];
      
      setComments(mockComments);
      console.log('✅ [AssignmentComments] Comments loaded:', mockComments.length);
      
    } catch (error) {
      console.error('❌ [AssignmentComments] Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitComment = async () => {
    if (!newMessage.trim() || !user) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('📝 [AssignmentComments] Submitting comment...');
      
      const commentData = {
        submission_id: submissionId,
        message: newMessage.trim(),
        is_revision_request: isRevisionRequest,
        is_instructor_only: isInstructorOnly
      };
      
      // Simular llamada API
      // const newComment = await assignmentService.createSubmissionComment(commentData);
      
      // Mock comment para demo
      const newComment: Comment = {
        id: Date.now().toString(),
        submission_id: submissionId,
        user_id: user.id,
        user_name: user.full_name,
        user_role: isInstructor ? 'instructor' : 'student',
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        is_revision_request: isRevisionRequest,
        is_instructor_only: isInstructorOnly
      };
      
      setComments(prev => [...prev, newComment]);
      setNewMessage('');
      setIsRevisionRequest(false);
      setIsInstructorOnly(false);
      
      // Notificar sobre nuevo comentario
      if (onNewComment) {
        onNewComment(newComment);
      }
      
      // Enviar notificación al otro usuario
      await sendCommentNotification(newComment);
      
      // Si es una solicitud de revisión
      if (isRevisionRequest && onRevisionRequested) {
        onRevisionRequested();
      }
      
      console.log('✅ [AssignmentComments] Comment submitted successfully');
      
    } catch (error) {
      console.error('❌ [AssignmentComments] Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendCommentNotification = async (comment: Comment) => {
    try {
      // Obtener información del assignment para la notificación
      const assignment = await assignmentService.getAssignment(assignmentId);
      
      const notificationData = {
        type: comment.is_revision_request ? 'assignment_revision_requested' : 'assignment_comment',
        title: comment.is_revision_request 
          ? 'Revisión solicitada en assignment' 
          : 'Nuevo comentario en assignment',
        message: comment.is_revision_request
          ? `Se ha solicitado una revisión en "${assignment.title}"`
          : `Nuevo comentario en "${assignment.title}": ${comment.message.substring(0, 100)}...`,
        related_id: submissionId,
        metadata: {
          assignment_id: assignmentId,
          course_id: courseId,
          comment_id: comment.id,
          is_revision_request: comment.is_revision_request
        }
      };
      
      await notificationService.createNotification(notificationData);
      console.log('🔔 [AssignmentComments] Notification sent for comment');
      
    } catch (error) {
      console.error('❌ [AssignmentComments] Error sending notification:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'instructor':
      case 'admin':
        return 'text-blue-600';
      case 'student':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'instructor':
        return 'Instructor';
      case 'admin':
        return 'Admin';
      case 'student':
        return 'Estudiante';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-4 w-4 bg-gray-300 rounded"></div>
            <div className="h-4 w-32 bg-gray-300 rounded"></div>
          </div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">
            Comentarios y Feedback
          </h3>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
            {comments.length}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="px-6 py-4 max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500">No hay comentarios aún</p>
              <p className="text-sm text-gray-400">
                {isInstructor 
                  ? 'Inicia la conversación con feedback para el estudiante'
                  : 'El instructor puede dejar comentarios aquí'
                }
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`flex items-start space-x-3 ${
                  comment.user_id === user?.id ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  <UserCircleIcon className={`h-8 w-8 ${getRoleColor(comment.user_role)}`} />
                </div>
                
                <div className={`flex-1 min-w-0 ${comment.user_id === user?.id ? 'text-right' : ''}`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.user_name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(comment.user_role)} bg-opacity-10`}>
                      {getRoleBadge(comment.user_role)}
                    </span>
                    {comment.is_revision_request && (
                      <span className="inline-flex items-center text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                        Revisión solicitada
                      </span>
                    )}
                    {comment.is_instructor_only && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        Solo instructores
                      </span>
                    )}
                  </div>
                  
                  <div className={`rounded-lg p-3 ${
                    comment.user_id === user?.id 
                      ? 'bg-blue-600 text-white ml-8' 
                      : 'bg-gray-100 text-gray-900 mr-8'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{comment.message}</p>
                  </div>
                  
                  <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                    <ClockIcon className="h-3 w-3" />
                    <span>{formatTimestamp(comment.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="space-y-3">
          {/* Options for instructors */}
          {isInstructor && (
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isRevisionRequest}
                  onChange={(e) => setIsRevisionRequest(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Solicitar revisión
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isInstructorOnly}
                  onChange={(e) => setIsInstructorOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Solo para instructores
                </span>
              </label>
            </div>
          )}

          {/* Message input */}
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isInstructor 
                  ? "Escribe feedback para el estudiante..." 
                  : "Escribe una pregunta o comentario..."}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmitComment();
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Presiona Cmd/Ctrl + Enter para enviar
              </p>
            </div>
            
            <button
              onClick={handleSubmitComment}
              disabled={!newMessage.trim() || isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <PaperAirplaneIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentComments;
