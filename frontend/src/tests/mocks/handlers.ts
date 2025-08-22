/**
 * MSW Handlers - Mock API responses para testing
 */
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:8000/api/v1';

export const handlers = [
  // ==================== AUTH ENDPOINTS ====================
  http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json({
      access_token: 'mock-jwt-token',
      token_type: 'bearer',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student'
      }
    });
  }),

  http.post(`${API_BASE}/auth/register`, () => {
    return HttpResponse.json({
      message: 'User registered successfully',
      user: {
        id: '2',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'student'
      }
    });
  }),

  http.get(`${API_BASE}/auth/me`, () => {
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'student'
    });
  }),

  // ==================== COURSES ENDPOINTS ====================
  http.get(`${API_BASE}/courses`, () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Test Course 1',
        description: 'A test course',
        instructor_id: '1',
        instructor_name: 'John Doe',
        level: 'beginner',
        category: 'programming',
        is_published: true,
        lessons_count: 5,
        enrollments_count: 10,
        created_at: '2024-01-01T00:00:00Z',
        thumbnail_url: '/test-image.jpg',
        price: 99.99
      },
      {
        id: '2',
        title: 'Test Course 2',
        description: 'Another test course',
        instructor_id: '2',
        instructor_name: 'Jane Smith',
        level: 'intermediate',
        category: 'design',
        is_published: true,
        lessons_count: 8,
        enrollments_count: 25,
        created_at: '2024-01-02T00:00:00Z',
        thumbnail_url: '/test-image-2.jpg',
        price: 149.99
      }
    ]);
  }),

  // COURSES AVAILABLE ENDPOINT - El que usa CoursesPage
  http.get(`${API_BASE}/courses/available`, () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Test Course 1',
        description: 'A test course',
        instructor_id: '1',
        instructor_name: 'John Doe',
        level: 'beginner',
        category: 'programming',
        is_published: true,
        lessons_count: 5,
        enrollments_count: 10,
        created_at: '2024-01-01T00:00:00Z',
        thumbnail_url: '/test-image.jpg',
        price: 99.99
      },
      {
        id: '2',
        title: 'Test Course 2',
        description: 'Another test course',
        instructor_id: '2',
        instructor_name: 'Jane Smith',
        level: 'intermediate',
        category: 'design',
        is_published: true,
        lessons_count: 8,
        enrollments_count: 25,
        created_at: '2024-01-02T00:00:00Z',
        thumbnail_url: '/test-image-2.jpg',
        price: 149.99
      }
    ]);
  }),

  http.get(`${API_BASE}/courses/:courseId`, ({ params }) => {
    const { courseId } = params;
    return HttpResponse.json({
      id: courseId,
      title: 'Detailed Test Course',
      description: 'A detailed test course description',
      instructor_id: '1',
      instructor_name: 'John Doe',
      level: 'beginner',
      category: 'programming',
      is_published: true,
      lessons_count: 5,
      enrollments_count: 10,
      created_at: '2024-01-01T00:00:00Z',
      thumbnail_url: '/test-image.jpg',
      price: 99.99,
      lessons: [
        {
          id: '1',
          title: 'Introduction',
          description: 'Course introduction',
          content_type: 'video',
          order: 1,
          duration: 600,
          is_free: true
        },
        {
          id: '2', 
          title: 'Getting Started',
          description: 'Getting started lesson',
          content_type: 'video',
          order: 2,
          duration: 900,
          is_free: false
        }
      ]
    });
  }),

  http.get(`${API_BASE}/courses/available`, () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Test Course 1',
        description: 'A test course',
        instructor_id: '1',
        instructor_name: 'John Doe',
        level: 'beginner',
        category: 'occupational_safety',
        is_published: true,
        lessons_count: 5,
        enrollments_count: 15,
        created_at: '2024-01-01T00:00:00Z',
        thumbnail_url: '/test-image.jpg',
        price: 99.99
      },
      {
        id: '2',
        title: 'Test Course 2',
        description: 'Another test course',
        instructor_id: '2',
        instructor_name: 'Jane Smith',
        level: 'intermediate',
        category: 'design',
        is_published: true,
        lessons_count: 8,
        enrollments_count: 25,
        created_at: '2024-01-02T00:00:00Z',
        thumbnail_url: '/test-image-2.jpg',
        price: 149.99
      }
    ]);
  }),

  // ==================== LESSONS ENDPOINTS ====================
  http.get(`${API_BASE}/lessons/course/:courseId`, ({ params }) => {
    const { courseId } = params;
    return HttpResponse.json([
      {
        id: '1',
        title: 'Introduction',
        description: 'Course introduction',
        content_type: 'video',
        course_id: courseId,
        order: 1,
        duration: 600,
        is_free: true,
        video_url: '/test-video-1.mp4'
      },
      {
        id: '2',
        title: 'Getting Started', 
        description: 'Getting started lesson',
        content_type: 'video',
        course_id: courseId,
        order: 2,
        duration: 900,
        is_free: false,
        video_url: '/test-video-2.mp4'
      }
    ]);
  }),

  http.get(`${API_BASE}/lessons/:lessonId`, ({ params }) => {
    const { lessonId } = params;
    return HttpResponse.json({
      id: lessonId,
      title: 'Test Lesson',
      description: 'A test lesson',
      content_type: 'video',
      course_id: '1',
      order: 1,
      duration: 600,
      is_free: true,
      video_url: '/test-video.mp4',
      content: 'Video lesson content'
    });
  }),

  // ==================== ADMIN ENDPOINTS ====================
  http.get(`${API_BASE}/admin/dashboard`, () => {
    return HttpResponse.json({
      total_users: 150,
      total_courses: 25,
      new_users_this_month: 12,
      published_courses: 18,
      total_enrollments: 450,
      platform_revenue: 15750.50
    });
  }),

  http.get(`${API_BASE}/admin/users`, () => {
    return HttpResponse.json({
      users: [
        {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          created_at: '2024-01-01T00:00:00Z',
          is_active: true
        },
        {
          id: '2',
          email: 'instructor@example.com',
          name: 'Instructor User',
          role: 'instructor', 
          created_at: '2024-01-02T00:00:00Z',
          is_active: true
        },
        {
          id: '3',
          email: 'student@example.com',
          name: 'Student User',
          role: 'student',
          created_at: '2024-01-03T00:00:00Z',
          is_active: true
        }
      ],
      total: 3,
      page: 1,
      limit: 10
    });
  }),

  http.get(`${API_BASE}/admin/courses`, () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Admin Test Course',
        instructor_id: '2',
        instructor_name: 'Instructor User',
        level: 'beginner',
        category: 'programming',
        is_published: true,
        lessons_count: 5,
        enrollments_count: 25,
        created_at: '2024-01-01T00:00:00Z',
        status_label: 'Published'
      }
    ]);
  }),

  // ==================== ADMIN DASHBOARD ENDPOINT ====================
  http.get(`${API_BASE}/admin/dashboard`, () => {
    return HttpResponse.json({
      users_total: 150,
      courses_total: 25,
      users_new_month: 12,
      courses_published: 18
    });
  }),

  // ==================== ANALYTICS ENDPOINTS ====================
  http.get(`${API_BASE}/analytics/platform`, () => {
    return HttpResponse.json({
      total_users: 150,
      active_users_7d: 75,
      active_users_30d: 120,
      total_courses: 25,
      published_courses: 18,
      total_lessons: 180,
      total_enrollments: 450,
      completion_rate: 0.68,
      avg_session_duration: 1850,
      revenue_total: 15750.50,
      revenue_30d: 3200.25
    });
  }),

  // ==================== ENROLLMENTS ENDPOINTS ====================
  http.get(`${API_BASE}/enrollments/`, () => {
    return HttpResponse.json([
      {
        id: '1',
        user_id: '1',
        course_id: '1',
        status: 'ACTIVE',
        enrolled_at: '2024-01-01T00:00:00Z',
        completed_at: null,
        progress_percentage: 45.5,
        last_lesson_id: '2'
      },
      {
        id: '2',
        user_id: '1',
        course_id: '2',
        status: 'COMPLETED',
        enrolled_at: '2024-01-02T00:00:00Z',
        completed_at: '2024-01-15T00:00:00Z',
        progress_percentage: 100,
        last_lesson_id: '8'
      }
    ]);
  }),

  http.post(`${API_BASE}/enrollments/`, () => {
    return HttpResponse.json({
      id: '3',
      user_id: '1',
      course_id: '3',
      status: 'ACTIVE',
      enrolled_at: new Date().toISOString(),
      completed_at: null,
      progress_percentage: 0,
      last_lesson_id: null
    }, { status: 201 });
  }),

  http.get(`${API_BASE}/enrollments/:enrollmentId/status`, ({ params }) => {
    return HttpResponse.json({
      course_id: params.enrollmentId,
      status: 'ACTIVE',
      progress_percentage: 45.5,
      can_enroll: false,
      is_enrolled: true
    });
  }),

  http.delete(`${API_BASE}/enrollments/:enrollmentId`, () => {
    return HttpResponse.json({ message: 'Enrollment cancelled successfully' });
  }),

  // OPTIONS request for CORS
  http.options(`${API_BASE}/enrollments/*`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  // ==================== PROGRESS ENDPOINTS ====================
  http.get(`${API_BASE}/progress/summary`, () => {
    return HttpResponse.json({
      courses_enrolled: 3,
      courses_completed: 1,
      lessons_completed: 15,
      total_watch_time: 7200,
      completion_rate: 0.65,
      current_streak: 5,
      total_points: 850,
      level: 4
    });
  }),

  http.put(`${API_BASE}/progress/videos/:lessonId/:videoId`, ({ params }) => {
    return HttpResponse.json({
      lesson_id: params.lessonId,
      video_id: params.videoId,
      progress: 0.75,
      watch_time: 450,
      last_position: 337.5,
      completed: false,
      updated_at: new Date().toISOString()
    });
  }),

  // ==================== ERROR HANDLERS ====================
  http.get(`${API_BASE}/error/404`, () => {
    return HttpResponse.json({ detail: 'Resource not found' }, { status: 404 });
  }),

  http.get(`${API_BASE}/error/500`, () => {
    return HttpResponse.json({ detail: 'Internal server error' }, { status: 500 });
  })
];
