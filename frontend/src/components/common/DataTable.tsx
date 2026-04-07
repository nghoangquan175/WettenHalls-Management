import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "../../utils/cn";

export interface Column<T> {
  header: ReactNode | string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isFetchingNextPage?: boolean;
  wrapperClassName?: string;
}

const DataTable = <T extends { id: string | number }>({
  columns,
  data,
  onRowClick,
  isLoading,
  emptyMessage = "No data found.",
  onLoadMore,
  hasMore,
  isFetchingNextPage,
  wrapperClassName,
}: DataTableProps<T>) => {
  
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && onLoadMore && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, onLoadMore, isFetchingNextPage]);

  return (
    <div className={cn(
      "w-full bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-300",
      wrapperClassName || "overflow-x-auto"
    )}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-50 bg-gray-50/50">
            {columns.map((column, index) => (
              <th
                key={index}
                className={cn(
                  "px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 select-none",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                  <p className="ContentSMedium text-gray-400">Fetching records...</p>
                </div>
              </td>
            </tr>
          ) : data.length > 0 ? (
            data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "group transition-colors duration-150",
                  onRowClick ? "cursor-pointer hover:bg-gray-50/80" : "hover:bg-gray-50/40"
                )}
              >
                {columns.map((column, index) => (
                  <td
                    key={index}
                    className={cn(
                      "px-6 py-4 ContentSMedium text-gray-600 transition-colors group-hover:text-gray-900",
                      column.className
                    )}
                  >
                    {typeof column.accessor === "function"
                      ? column.accessor(item)
                      : (item[column.accessor] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-20 text-center">
                <p className="ContentMRegular text-gray-400 italic">{emptyMessage}</p>
              </td>
            </tr>
          )}

          {/* Infinity Scroll Load More Trigger */}
          {hasMore && (
            <tr>
              <td colSpan={columns.length} className="p-0">
                <div ref={observerTarget} className="h-10 flex items-center justify-center">
                  {isFetchingNextPage && (
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
