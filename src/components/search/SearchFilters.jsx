import React from "react";
import { Filter, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "../ui/LanguageSwitcher";

export default function SearchFilters({ 
  filters, 
  onFilterChange,
  availableCities,
  categories,
  provinces
}) {
  const { t } = useLanguage();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFiltersCount = [
    filters.category !== "all",
    filters.provincia !== "all",
    filters.ciudad !== "all",
    filters.minRating > 0,
    filters.availability !== "all"
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-2.5 items-center">
        <Select value={filters.category} onValueChange={(val) => onFilterChange({ ...filters, category: val })}>
          <SelectTrigger className="h-11 border-2 border-gray-200 text-sm rounded-lg md:w-[220px] font-medium hover:border-blue-300 transition-colors">
            <SelectValue placeholder={t('allCategories')}>
              {filters.category === "all" ? t('allCategories') : (t(filters.category) || filters.category)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">{t('allCategories')}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>{t(cat.name) || cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.provincia} onValueChange={(val) => {
          onFilterChange({ ...filters, provincia: val, ciudad: "all" });
        }}>
          <SelectTrigger className="h-11 border-2 border-gray-200 text-sm rounded-lg md:w-[200px] font-medium hover:border-blue-300 transition-colors">
            <SelectValue placeholder={t('allProvinces')} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">{t('allProvinces')}</SelectItem>
            {provinces.map((prov) => (
              <SelectItem key={prov} value={prov}>{prov}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.ciudad} onValueChange={(val) => onFilterChange({ ...filters, ciudad: val })} disabled={filters.provincia === "all"}>
          <SelectTrigger className="h-11 border-2 border-gray-200 text-sm rounded-lg md:w-[200px] font-medium hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <SelectValue placeholder={filters.provincia === "all" ? "Primero selecciona provincia" : t('allCities')} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">{t('allCities')}</SelectItem>
            {availableCities.map((ciudad) => (
              <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-11 px-4 border-2 border-gray-200 hover:border-blue-300 relative"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros avanzados
              {activeFiltersCount > 3 && (
                <Badge className="ml-2 bg-blue-600 text-white h-5 min-w-5 rounded-full px-1.5">
                  {activeFiltersCount - 3}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Valoración mínima
                </label>
                <div className="space-y-2">
                  <Slider
                    value={[filters.minRating]}
                    onValueChange={(val) => onFilterChange({ ...filters, minRating: val[0] })}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Todas</span>
                    <Badge variant="outline" className="bg-yellow-50">
                      {filters.minRating > 0 ? `${filters.minRating}+ ⭐` : 'Sin filtro'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Disponibilidad
                </label>
                <Select value={filters.availability} onValueChange={(val) => onFilterChange({ ...filters, availability: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las disponibilidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las disponibilidades</SelectItem>
                    <SelectItem value="laborables">Solo días laborables</SelectItem>
                    <SelectItem value="festivos">Fines de semana y festivos</SelectItem>
                    <SelectItem value="ambos">Disponible toda la semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => {
                  onFilterChange({
                    ...filters,
                    minRating: 0,
                    availability: "all"
                  });
                }}
                variant="outline"
                className="w-full"
                size="sm"
              >
                Limpiar filtros avanzados
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange({
              category: "all",
              provincia: "all",
              ciudad: "all",
              minRating: 0,
              availability: "all"
            })}
            className="text-xs text-gray-500 hover:text-gray-700 h-11 md:ml-auto whitespace-nowrap"
          >
            ✕ Limpiar todos ({activeFiltersCount})
          </Button>
        )}
      </div>
    </div>
  );
}