/**
 * Contenido tabulado para CourseDetailPage
 */
import React, { useState } from 'react';
import { CourseDetail, LessonOverview, UserCourseAccess } from '../../types/course';
import { 
  BookOpen, 
  CheckCircle, 
  Lock, 
  PlayCircle, 
  Clock,
  User,
  Target,
  List
} from 'lucide-react';

interface CourseContentProps {
  course: CourseDetail;
  lessons: LessonOverview[];
  userAccess: UserCourseAccess;
  onLessonClick?: (lessonId: string) => void;
}

type TabType = 'overview' | 'content' | 'instructor';

const CourseContent: React.FC<CourseContentProps> = ({
  course,
  lessons,
  userAccess,
  onLessonClick
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Formatear duración en minutos
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`;
  };

  // Obtener icono del tipo de contenido
  const getContentTypeIcon = (type: 'video' | 'text' | 'quiz') => {
    switch (type) {
      case 'video':
        return <PlayCircle className="w-5 h-5 text-blue-500" />;
      case 'text':
        return <BookOpen className="w-5 h-5 text-green-500" />;
      case 'quiz':
        return <CheckCircle className="w-5 h-5 text-purple-500" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-500" />;
    }
  };

  // Renderizar tab de overview
  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Descripción extendida */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
          Acerca de este curso
        </h3>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {course.description}
          </p>
        </div>
      </div>

      {/* Lo que aprenderás */}
      {course.what_you_will_learn?.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-6 h-6 mr-2 text-green-600" />
            Lo que aprenderás
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {course.what_you_will_learn.map((objective, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{objective}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requisitos */}
      {course.requirements?.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <List className="w-6 h-6 mr-2 text-orange-600" />
            Requisitos
          </h3>
          <ul className="space-y-2">
            {course.requirements.map((requirement, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">{requirement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {course.tags?.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Etiquetas</h3>
          <div className="flex flex-wrap gap-2">
            {course.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Renderizar tab de contenido (lecciones)
  const renderContentTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          Contenido del curso ({lessons.length} lecciones)
        </h3>
        <div className="text-sm text-gray-500">
          Duración total: {formatDuration(course.total_duration)}
        </div>
      </div>

      <div className="space-y-1">
        {lessons.map((lesson, index) => (
          <div
            key={lesson.id}
            className={`
              group border border-gray-200 rounded-lg p-4 transition-all duration-200
              ${lesson.has_access 
                ? 'hover:border-blue-300 hover:shadow-sm cursor-pointer' 
                : 'bg-gray-50'
              }
            `}
            onClick={() => lesson.has_access && onLessonClick?.(lesson.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                {/* Número de lección */}
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                  {index + 1}
                </div>

                {/* Icono de tipo de contenido */}
                <div className="flex-shrink-0">
                  {getContentTypeIcon(lesson.content_type)}
                </div>

                {/* Info de la lección */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className={`
                      text-base font-medium truncate
                      ${lesson.has_access ? 'text-gray-900' : 'text-gray-500'}
                    `}>
                      {lesson.title}
                    </h4>
                    
                    {/* Estados */}
                    {lesson.is_completed && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    
                    {!lesson.has_access && (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                    
                    {lesson.is_free_preview && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                        Gratis
                      </span>
                    )}
                  </div>
                  
                  {lesson.description && (
                    <p className="text-sm text-gray-500 mt-1 truncate">
                      {lesson.description}
                    </p>
                  )}
                </div>

                {/* Duración */}
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(lesson.duration)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje si no tiene acceso a ninguna lección */}
      {lessons.length > 0 && !lessons.some(l => l.has_access) && !userAccess.is_enrolled && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Contenido exclusivo para estudiantes
          </h4>
          <p className="text-gray-600">
            Inscríbete en el curso para acceder a todas las lecciones
          </p>
        </div>
      )}
    </div>
  );

  // Renderizar tab de instructor
  const renderInstructorTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
        {/* Avatar del instructor */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-300 rounded-full flex items-center justify-center">
            {course.instructor.avatar ? (
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-gray-500" />
            )}
          </div>
        </div>

        {/* Info del instructor */}
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900">
            {course.instructor.name}
          </h3>
          
          {course.instructor.title && (
            <p className="text-lg text-gray-600 mt-1">
              {course.instructor.title}
            </p>
          )}

          {/* Stats del instructor */}
          <div className="flex items-center space-x-6 mt-4">
            {course.instructor.rating && (
              <div className="flex items-center space-x-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(course.instructor.rating!) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </div>
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {course.instructor.rating.toFixed(1)}
                </span>
              </div>
            )}

            {course.instructor.total_courses && (
              <div className="text-sm text-gray-600">
                {course.instructor.total_courses} cursos
              </div>
            )}

            {course.instructor.total_students && (
              <div className="text-sm text-gray-600">
                {course.instructor.total_students.toLocaleString()} estudiantes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio del instructor */}
      {course.instructor.bio && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Acerca del instructor</h4>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {course.instructor.bio}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Descripción', icon: BookOpen },
    { id: 'content', label: 'Contenido', icon: List },
    { id: 'instructor', label: 'Instructor', icon: User }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6" aria-label="Tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as TabType)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'content' && renderContentTab()}
        {activeTab === 'instructor' && renderInstructorTab()}
      </div>
    </div>
  );
};

export default CourseContent;
