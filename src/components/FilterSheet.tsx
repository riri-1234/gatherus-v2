import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { CATEGORIES, LOCATIONS } from '@/lib/constants';
import { Filter, X } from 'lucide-react';

export interface FilterState {
  categories: string[];
  locations: string[];
  dateRange: 'all' | 'today' | 'week' | 'weekend';
  freeOnly: boolean;
  openOnly: boolean;
  maxGroupSize: number | null;
}

interface FilterSheetProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  trigger?: React.ReactNode;
}

const defaultFilters: FilterState = {
  categories: [],
  locations: [],
  dateRange: 'all',
  freeOnly: false,
  openOnly: false,
  maxGroupSize: null,
};

export const FilterSheet = ({ filters, onFiltersChange, trigger }: FilterSheetProps) => {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const toggleCategory = (category: string) => {
    setLocalFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleLocation = (location: string) => {
    setLocalFilters(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location],
    }));
  };

  const activeCount = 
    localFilters.categories.length + 
    localFilters.locations.length + 
    (localFilters.dateRange !== 'all' ? 1 : 0) +
    (localFilters.freeOnly ? 1 : 0) +
    (localFilters.openOnly ? 1 : 0) +
    (localFilters.maxGroupSize ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="relative">
            <Filter className="w-5 h-5" />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center justify-between">
            <span>Filters</span>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Date Range */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">When</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'Any time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This week' },
                { value: 'weekend', label: 'Weekend' },
              ].map(option => (
                <Badge
                  key={option.value}
                  variant={localFilters.dateRange === option.value ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2"
                  onClick={() => setLocalFilters(prev => ({ ...prev, dateRange: option.value as FilterState['dateRange'] }))}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Categories</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {CATEGORIES.map(category => (
                <Badge
                  key={category.value}
                  variant={localFilters.categories.includes(category.value) ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1.5"
                  onClick={() => toggleCategory(category.value)}
                >
                  {category.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Location</Label>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map(location => (
                <Badge
                  key={location}
                  variant={localFilters.locations.includes(location) ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1.5"
                  onClick={() => toggleLocation(location)}
                >
                  {location}
                </Badge>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="free-only">Free events only</Label>
              <Switch
                id="free-only"
                checked={localFilters.freeOnly}
                onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, freeOnly: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="open-only">Open RSVP only</Label>
              <Switch
                id="open-only"
                checked={localFilters.openOnly}
                onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, openOnly: checked }))}
              />
            </div>
          </div>

          {/* Group Size */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">
              Max Group Size: {localFilters.maxGroupSize || 'Any'}
            </Label>
            <Slider
              value={[localFilters.maxGroupSize || 100]}
              onValueChange={([value]) => setLocalFilters(prev => ({ 
                ...prev, 
                maxGroupSize: value === 100 ? null : value 
              }))}
              min={5}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Filter by event capacity
            </p>
          </div>

          {/* Coming Soon Features */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Coming Soon</p>
            <div className="flex flex-wrap gap-2 opacity-50">
              <Badge variant="outline" className="cursor-not-allowed">
                Same School Only
              </Badge>
              <Badge variant="outline" className="cursor-not-allowed">
                Friends Going
              </Badge>
              <Badge variant="outline" className="cursor-not-allowed">
                Time of Day
              </Badge>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <Button onClick={handleApply} className="w-full gradient-warm text-primary-foreground">
            Apply Filters {activeCount > 0 && `(${activeCount})`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { defaultFilters };
