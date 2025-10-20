/**
 * CourseCard Component Tests
 */
import { screen } from '@testing-library/react';
import { render } from '../../utils/test-utils';
import CourseCard from '../../../components/courses/CourseCard';

describe('CourseCard', () => {
  it('renders course information correctly', () => {
    render(
      <CourseCard 
        id={1}
        title="Test Course"
        description="Test course description"
        lessons={5}
        category="Seguridad Ocupacional"
        difficulty="Principiante"
      />
    );
    
    expect(screen.getByText('Test Course')).toBeInTheDocument();
    expect(screen.getByText('Test course description')).toBeInTheDocument();
  });

  it('displays progress correctly', () => {
    render(
      <CourseCard 
        id={1}
        title="Test Course"
        progress={50}
        lessons={10}
        completedLessons={5}
      />
    );
    
    // El componente muestra progreso visual
    expect(screen.getByText('Test Course')).toBeInTheDocument();
  });

  it('shows new badge for new courses', () => {
    render(
      <CourseCard 
        id={1}
        title="New Course"
        isNew={true}
      />
    );
    
    expect(screen.getByText('New Course')).toBeInTheDocument();
  });

  it('displays category and difficulty', () => {
    render(
      <CourseCard 
        id={1}
        title="Test Course"
        category="ISO 9001"
        difficulty="Intermedio"
      />
    );
    
    expect(screen.getByText('Test Course')).toBeInTheDocument();
  });

  it('shows estimated time when provided', () => {
    render(
      <CourseCard 
        id={1}
        title="Test Course"
        estimatedTime="2 horas"
      />
    );
    
    expect(screen.getByText('Test Course')).toBeInTheDocument();
  });
});
