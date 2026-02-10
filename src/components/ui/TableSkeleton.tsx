import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

const TableSkeleton = ({ rows = 5, columns = 4, className }: TableSkeletonProps) => {
  return (
    <div className={cn("w-full overflow-hidden", className)}>
      {/* Header */}
      <div className="flex gap-4 border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`head-${i}`}
            className="h-3 rounded-full bg-slate-200"
            style={{ width: `${60 + Math.random() * 60}px` }}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className={cn(
            "flex items-center gap-4 border-b border-slate-100 px-4 py-4",
            rowIdx % 2 === 1 && "bg-slate-50/50"
          )}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              className="relative h-3 overflow-hidden rounded-full bg-slate-200/70"
              style={{ width: `${50 + Math.random() * 80}px` }}
            >
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TableSkeleton;
