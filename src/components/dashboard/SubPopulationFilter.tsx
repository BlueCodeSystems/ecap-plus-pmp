import { Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SubPopulationFilterProps {
  filters: Record<string, string>;
  labels: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
  className?: string;
}

export const SubPopulationFilter = ({
  filters,
  labels,
  onChange,
  onClear,
  className,
}: SubPopulationFilterProps) => {
  const getButtonStyles = (isActive: boolean) => {
    return cn(
      "w-full h-8 text-[10px] font-bold rounded transition-all",
      isActive
        ? "bg-[#2e7d52] text-white hover:bg-[#256643] border-none shadow-sm"
        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
    );
  };

  return (
    <div className={cn("bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden", className)}>
      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#2e7d52]" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Filter by Sub Population</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 px-3 text-[10px] font-bold text-slate-500 hover:text-[#2e7d52] hover:bg-emerald-50 gap-2 transition-colors uppercase tracking-widest"
        >
          <RotateCcw className="h-3 w-3" />
          Reset All
        </Button>
      </div>

      <ScrollArea className="w-full">
        <div className="p-6">
          <div className="flex gap-10 min-w-max pb-4">
            {Object.entries(labels).map(([key, label]) => (
              <div key={key} className="flex flex-col gap-3 w-[100px]">
                <span className="text-[11px] font-bold text-slate-800 leading-tight h-8 flex items-end">
                  {label}
                </span>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => onChange(key, "all")}
                    className={getButtonStyles(filters[key] === "all")}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => onChange(key, "yes")}
                    className={getButtonStyles(filters[key] === "yes")}
                  >
                    YES
                  </button>
                  <button
                    onClick={() => onChange(key, "no")}
                    className={getButtonStyles(filters[key] === "no")}
                  >
                    NO
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
