import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

/**
 * FormSkeleton Component
 *
 * Skeleton loader for forms
 * Provides visual feedback while form data is loading
 */
interface FormSkeletonProps {
  fields?: number;
  showHeader?: boolean;
  showActions?: boolean;
  className?: string;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  fields = 6,
  showHeader = true,
  showActions = true,
  className = ''
}) => {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
      )}

      <CardContent className="space-y-6">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-32" /> {/* Label */}
            <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
          </div>
        ))}

        {showActions && (
          <>
            <Separator className="my-6" />
            <div className="flex items-center justify-end gap-3">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * FormFieldSkeleton Component
 *
 * Skeleton for individual form field
 */
export const FormFieldSkeleton: React.FC = () => {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" /> {/* Label */}
      <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
    </div>
  );
};

/**
 * FormFieldGroupSkeleton Component
 *
 * Skeleton for a group of form fields with label
 */
interface FormFieldGroupSkeletonProps {
  fields?: number;
  label?: boolean;
}

export const FormFieldGroupSkeleton: React.FC<FormFieldGroupSkeletonProps> = ({
  fields = 3,
  label = true
}) => {
  return (
    <div className="space-y-4">
      {label && <Skeleton className="h-5 w-40" />}
      <div className="space-y-4 border rounded-lg p-4">
        {Array.from({ length: fields }).map((_, index) => (
          <FormFieldSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export default FormSkeleton;
