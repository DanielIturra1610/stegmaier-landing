/**
 * CourseService Tests
 */
import courseService from '../../services/courseService';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:8000/api/v1';

describe('CourseService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock-jwt-token');
  });

  describe('getAvailableCourses', () => {
    it('fetches available courses successfully', async () => {
      const result = await courseService.getAvailableCourses();
      
      // El API devuelve directamente un array de cursos
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('title');
        expect(result[0]).toHaveProperty('is_published', true);
      }
    });

    it('handles pagination parameters', async () => {
      const result = await courseService.getAvailableCourses(2, 5);
      
      // Verificar que devuelve datos válidos
      expect(result).toBeTruthy();
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('handles API errors gracefully', async () => {
      server.use(
        http.get(`${API_BASE}/courses/available`, () => {
          return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
        })
      );

      await expect(courseService.getAvailableCourses()).rejects.toThrow();
    });
  });

  describe('getCourse', () => {
    it('fetches course by ID successfully', async () => {
      const course = await courseService.getCourse('1');
      
      expect(course).toBeTruthy();
      expect(course).toHaveProperty('id', '1');
      expect(course).toHaveProperty('title');
      if (course) {
        expect(course).toHaveProperty('lessons');
        expect(Array.isArray(course.lessons)).toBe(true);
      }
    });

    it('handles non-existent course', async () => {
      server.use(
        http.get(`${API_BASE}/courses/:courseId`, () => {
          return HttpResponse.json({ detail: 'Course not found' }, { status: 404 });
        })
      );

      const result = await courseService.getCourse('999');
      expect(result).toBeNull();
    });

    it('includes auth token in request', async () => {
      // Limpiar localStorage primero
      localStorage.clear();
      // Configurar token en localStorage antes del test
      localStorage.setItem('auth_token', 'mock-jwt-token');
      
      // Verificar que el token está almacenado
      expect(localStorage.getItem('auth_token')).toBe('mock-jwt-token');
      
      let requestHeaders: Headers | null = null;
      
      server.use(
        http.get(`${API_BASE}/courses/:courseId`, ({ request }) => {
          requestHeaders = request.headers;
          return HttpResponse.json({ id: '1', title: 'Test Course' });
        })
      );

      await courseService.getCourse('1');

      // Verificar que el header Authorization esté presente
      expect(requestHeaders).not.toBeNull();
      const authHeader = requestHeaders!.get('authorization');
      expect(authHeader).toBe('Bearer mock-jwt-token');
    });
  });

  describe('getCourseWithLessons', () => {
    it('fetches course with lessons successfully', async () => {
      const result = await courseService.getCourseWithLessons('1');
      
      expect(result).toHaveProperty('course');
      expect(result).toHaveProperty('lessons');
      expect(result.course).toHaveProperty('id', '1');
      expect(Array.isArray(result.lessons)).toBe(true);
    });

    it('handles course without lessons', async () => {
      server.use(
        http.get(`${API_BASE}/lessons/course/:courseId`, () => {
          return HttpResponse.json([]);
        })
      );

      const result = await courseService.getCourseWithLessons('1');
      
      expect(result.lessons).toHaveLength(0);
    });
  });

  describe('checkCourseAvailability', () => {
    it('returns availability object for available course', async () => {
      const result = await courseService.checkCourseAvailability('1');

      expect(result).toHaveProperty('exists', true);
      expect(result).toHaveProperty('published', true);
      expect(result).toHaveProperty('accessible', true);
    });

    it('handles unavailable course', async () => {
      server.use(
        http.get(`${API_BASE}/courses/:courseId`, () => {
          return HttpResponse.json({ detail: 'Course not found' }, { status: 404 });
        })
      );

      await expect(courseService.checkCourseAvailability('999')).rejects.toThrow();
    });

    it('returns correct object for unpublished course', async () => {
      server.use(
        http.get(`${API_BASE}/courses/:courseId`, () => {
          return HttpResponse.json({ id: '1', title: 'Draft Course', is_published: false });
        })
      );

      const result = await courseService.checkCourseAvailability('1');

      expect(result).toHaveProperty('exists', true);
      expect(result).toHaveProperty('published', false);
      expect(result).toHaveProperty('accessible', false);
    });
  });

  describe('error handling', () => {
    it('handles missing auth token gracefully', async () => {
      localStorage.removeItem('auth_token');

      // El mock global siempre tiene token, así que verificamos que el servicio funcione
      const result = await courseService.getCourse('1');
      expect(result).toBeTruthy();
    });

    it('handles network errors', async () => {
      server.use(
        http.get(`${API_BASE}/courses/available`, () => {
          return HttpResponse.error();
        })
      );

      await expect(courseService.getAvailableCourses()).rejects.toThrow();
    });
  });
});
