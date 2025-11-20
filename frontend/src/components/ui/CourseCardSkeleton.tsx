import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * CourseCardSkeleton Component
 *
 * Skeleton loader for CourseCard component
 * Provides visual feedback while course data is loading
 */
export const CourseCardSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Thumbnail Skeleton */}
      <Skeleton className="h-48 w-full rounded-t-lg rounded-b-none" />

      <CardHeader className="space-y-3 pb-3">
        {/* Title Skeleton */}
        <Skeleton className="h-6 w-3/4" />

        {/* Category Badge Skeleton */}
        <Skeleton className="h-5 w-20" />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>

        {/* Meta info (instructor, students) */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Progress bar skeleton (if enrolled) */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

        {/* Action button */}
        <Skeleton className="h-10 w-full rounded-md" />
      </CardContent>
    </Card>
  );
};

/**
 * CourseCardSkeletonGrid Component
 *
 * Grid of skeleton course cards
 */
interface CourseCardSkeletonGridProps {
  count?: number;
  className?: string;
}

export const CourseCardSkeletonGrid: React.FC<CourseCardSkeletonGridProps> = ({
  count = 6,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <CourseCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default CourseCardSkeleton;
