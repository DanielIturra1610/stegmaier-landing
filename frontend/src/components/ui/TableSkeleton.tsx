import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/**
 * TableSkeleton Component
 *
 * Skeleton loader for tables
 * Provides visual feedback while table data is loading
 */
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showActions?: boolean;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showActions = true,
  className = ''
}) => {
  const totalColumns = showActions ? columns + 1 : columns;

  return (
    <div className={`rounded-md border ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: totalColumns }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-full" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  {colIndex === 0 ? (
                    // First column often has avatars or icons
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ) : (
                    <Skeleton className="h-4 w-full" />
                  )}
                </TableCell>
              ))}
              {showActions && (
                <TableCell>
                  <div className="flex items-center gap-2 justify-end">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

/**
 * TableSkeletonWithHeader Component
 *
 * Table skeleton with header search/filters
 */
interface TableSkeletonWithHeaderProps extends TableSkeletonProps {
  showSearch?: boolean;
  showFilters?: boolean;
  showAddButton?: boolean;
}

export const TableSkeletonWithHeader: React.FC<TableSkeletonWithHeaderProps> = ({
  rows = 5,
  columns = 4,
  showActions = true,
  showSearch = true,
  showFilters = true,
  showAddButton = true,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with search and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {showSearch && <Skeleton className="h-10 w-64 rounded-md" />}
          {showFilters && (
            <>
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
            </>
          )}
        </div>
        {showAddButton && <Skeleton className="h-10 w-32 rounded-md" />}
      </div>

      {/* Table */}
      <TableSkeleton rows={rows} columns={columns} showActions={showActions} />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
    </div>
  );
};

export default TableSkeleton;
