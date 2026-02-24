import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const activeFilters = Object.entries(filters).filter(
    ([_, value]) => value !== "all"
  );

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 gap-2 border-slate-200",
                hasActiveFilters && "border-emerald-500 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              )}
            >
              <Filter className="h-4 w-4" />
              <span className="text-xs font-semibold">Sub-population Filters</span>
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-[20px] rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white hover:bg-emerald-600"
                >
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[340px] p-0" align="start">
            <div className="flex items-center justify-between border-b p-3">
              <span className="text-sm font-bold text-slate-700">Filters</span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                  className="h-7 px-2 text-[10px] uppercase tracking-wider text-slate-500 hover:text-emerald-600"
                >
                  Clear All
                </Button>
              )}
            </div>
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-4">
                {Object.entries(labels).map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {label}
                      </span>
                    </div>
                    <ToggleGroup
                      type="single"
                      value={filters[key]}
                      onValueChange={(value) => value && onChange(key, value)}
                      className="justify-start gap-1"
                    >
                      <ToggleGroupItem
                        value="all"
                        variant="outline"
                        className="h-7 px-3 text-[10px] uppercase"
                      >
                        All
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="yes"
                        variant="outline"
                        className="h-7 px-3 text-[10px] uppercase data-[state=on]:bg-emerald-600 data-[state=on]:text-white data-[state=on]:border-emerald-600"
                      >
                        Yes
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="no"
                        variant="outline"
                        className="h-7 px-3 text-[10px] uppercase data-[state=on]:bg-slate-700 data-[state=on]:text-white data-[state=on]:border-slate-700"
                      >
                        No
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Visible Badges for active filters */}
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map(([key, value]) => (
            <Badge
              key={key}
              variant="outline"
              className={cn(
                "h-7 items-center gap-1.5 rounded-md pl-2 pr-1 text-[10px] font-bold uppercase tracking-wide transition-all",
                value === "yes"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              )}
            >
              <span>{labels[key]}: {value}</span>
              <button
                onClick={() => onChange(key, "all")}
                className="group flex h-4 w-4 items-center justify-center rounded-sm hover:bg-black/5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};
