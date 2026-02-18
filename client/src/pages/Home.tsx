import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { MapPin, Loader2, Check, ChevronsUpDown } from "lucide-react";

import { useCities, useTransportModes, useCalculateEstimate, usePlaces } from "@/hooks/use-travel";
import type { Place } from "@/data/places";
import { MapBackground } from "@/components/MapBackground";
import { EstimateCard } from "@/components/EstimateCard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function Home() {
  const { t, i18n } = useTranslation();
  const [selectedOrigin, setSelectedOrigin] = useState<{lat: number, lng: number} | undefined>();
  const [selectedDest, setSelectedDest] = useState<{lat: number, lng: number} | undefined>();
  const [selectionMode, setSelectionMode] = useState<'origin' | 'destination' | null>(null);

  const [originName, setOriginName] = useState("");
  const [destName, setDestName] = useState("");

  const { data: cities, isLoading: loadingCities } = useCities();
  const { data: modes, isLoading: loadingModes } = useTransportModes();
  const estimateMutation = useCalculateEstimate();

  const formSchema = z.object({
    citySlug: z.string().min(1, t('errors.selectCity')),
    modeSlug: z.string().min(1, t('errors.selectMode')),
    originLat: z.string().refine((val) => !isNaN(parseFloat(val)), t('errors.invalidLatitude')),
    originLng: z.string().refine((val) => !isNaN(parseFloat(val)), t('errors.invalidLongitude')),
    destLat: z.string().refine((val) => !isNaN(parseFloat(val)), t('errors.invalidLatitude')),
    destLng: z.string().refine((val) => !isNaN(parseFloat(val)), t('errors.invalidLongitude')),
    isNight: z.boolean().default(false),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      citySlug: "casablanca",
      modeSlug: "",
      originLat: "33.5992",
      originLng: "-7.6192",
      destLat: "33.5753",
      destLng: "-7.7061",
    },
  });

  const selectedCity = form.watch("citySlug");
  const { data: places = [], isLoading: loadingPlaces } = usePlaces(selectedCity);

  const handleMapClick = (lat: number, lng: number) => {
    if (selectionMode === 'origin') {
      form.setValue("originLat", lat.toFixed(6));
      form.setValue("originLng", lng.toFixed(6));
      setSelectedOrigin({ lat, lng });
      setOriginName(`Map: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      setSelectionMode(null);
    } else if (selectionMode === 'destination') {
      form.setValue("destLat", lat.toFixed(6));
      form.setValue("destLng", lng.toFixed(6));
      setSelectedDest({ lat, lng });
      setDestName(`Map: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      setSelectionMode(null);
    }
  };

  const handleContextMenuSelect = (lat: number, lng: number, type: 'origin' | 'destination') => {
    if (type === 'origin') {
      form.setValue("originLat", lat.toFixed(6));
      form.setValue("originLng", lng.toFixed(6));
      setSelectedOrigin({ lat, lng });
      setOriginName(`Map: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } else {
      form.setValue("destLat", lat.toFixed(6));
      form.setValue("destLng", lng.toFixed(6));
      setSelectedDest({ lat, lng });
      setDestName(`Map: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    estimateMutation.mutate({
      citySlug: data.citySlug,
      transportModeSlug: data.modeSlug,
      originLat: parseFloat(data.originLat),
      originLng: parseFloat(data.originLng),
      destLat: parseFloat(data.destLat),
      destLng: parseFloat(data.destLng),
      travelTime: new Date().toISOString(),
      isNightOverride: data.isNight,
    });
  };

  const setDemoLocation = (type: 'origin' | 'dest', name: string) => {
    const place = places.find(p => p.name === name);
    if (!place) return;
    
    if (type === 'origin') {
      form.setValue("originLat", place.lat.toString());
      form.setValue("originLng", place.lng.toString());
      setSelectedOrigin({ lat: place.lat, lng: place.lng });
      setOriginName(name);
    } else {
      form.setValue("destLat", place.lat.toString());
      form.setValue("destLng", place.lng.toString());
      setSelectedDest({ lat: place.lat, lng: place.lng });
      setDestName(name);
    }
  };

  const isRTL = i18n.language === 'ar';

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col md:flex-row" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 w-full h-full">
        <MapBackground 
          origin={selectedOrigin} 
          destination={selectedDest} 
          onMapClick={handleMapClick}
          onContextMenuSelect={handleContextMenuSelect}
          selectionMode={selectionMode}
        />
      </div>

      <div className="relative z-10 w-full md:w-[450px] h-full flex flex-col pointer-events-none">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pointer-events-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display font-bold text-primary">
                  {t('app.name')} <span className="font-arabic">دليل</span>
                </h1>
                <p className="text-sm text-muted-foreground">{t('app.tagline')}</p>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <Link
                  href="/pricing"
                  className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
                >
                  {t('nav.pricing')}
                </Link>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-xl border-white/50 bg-white/95 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{t('home.title')}</CardTitle>
                <CardDescription>{t('home.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="citySlug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase font-semibold text-muted-foreground">
                              {t('home.city')}
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-50 border-slate-200">
                                  <SelectValue placeholder={t('home.selectCity')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {loadingCities ? (
                                  <div className="p-2 text-xs text-center text-muted-foreground">{t('home.loading')}</div>
                                ) : (
                                  cities?.map(city => (
                                    <SelectItem key={city.id} value={city.slug}>{city.name}</SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="modeSlug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase font-semibold text-muted-foreground">
                              {t('home.mode')}
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-50 border-slate-200">
                                  <SelectValue placeholder={t('home.selectMode')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {loadingModes ? (
                                  <div className="p-2 text-xs text-center text-muted-foreground">{t('home.loading')}</div>
                                ) : (
                                  modes?.map(mode => (
                                    <SelectItem key={mode.id} value={mode.slug}>{mode.name}</SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">{t('home.nightPricing')}</FormLabel>
                        <p className="text-xs text-muted-foreground">{t('home.nightPricingDescription')}</p>
                      </div>
                      <FormField
                        control={form.control}
                        name="isNight"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="h-px bg-slate-100 my-2" />

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <FormLabel className="flex items-center gap-2 text-sm font-medium">
                          <div className="w-2 h-2 rounded-full bg-primary" /> {t('home.origin')}
                        </FormLabel>
                        <div className="flex gap-2">
                          <LocationSearch 
                            placeholder={t('home.searchPlaceholder')}
                            selectedValue={originName}
                            places={places}
                            isLoading={loadingPlaces}
                            onSelect={(name) => setDemoLocation('origin', name)}
                            onPickOnMap={() => setSelectionMode('origin')}
                            isActive={selectionMode === 'origin'}
                            t={t}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <FormLabel className="flex items-center gap-2 text-sm font-medium">
                          <div className="w-2 h-2 rounded-full bg-accent" /> {t('home.destination')}
                        </FormLabel>
                        <div className="flex gap-2">
                          <LocationSearch 
                            placeholder={t('home.searchPlaceholder')}
                            selectedValue={destName}
                            places={places}
                            isLoading={loadingPlaces}
                            onSelect={(name) => setDemoLocation('dest', name)}
                            onPickOnMap={() => setSelectionMode('destination')}
                            isActive={selectionMode === 'destination'}
                            t={t}
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all mt-2"
                      disabled={estimateMutation.isPending}
                    >
                      {estimateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('home.calculating')}
                        </>
                      ) : (
                        t('home.calculateFare')
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
          
          <div className="mt-6">
            <AnimatePresence mode="wait">
              {(estimateMutation.data || estimateMutation.isPending) && (
                <EstimateCard 
                  estimate={estimateMutation.data || null} 
                  isLoading={estimateMutation.isPending} 
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <div className="hidden md:block absolute bottom-4 right-4 z-[5] bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs text-muted-foreground border border-white/50">
        {t('app.copyright', { year: new Date().getFullYear() })}
      </div>
    </div>
  );
}

function LocationSearch({ 
  placeholder, 
  selectedValue,
  places,
  isLoading,
  onSelect, 
  onPickOnMap,
  isActive,
  t,
}: { 
  placeholder: string; 
  selectedValue: string;
  places: Place[];
  isLoading: boolean;
  onSelect: (name: string) => void; 
  onPickOnMap: () => void;
  isActive: boolean;
  t: (key: string) => string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-2 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between bg-slate-50 border-slate-200"
          >
            <span className="truncate">{selectedValue || placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder={t('home.searchPlaceholder')} />
            <CommandList>
              {isLoading ? (
                <div className="p-4 text-sm text-center text-muted-foreground">{t('home.loadingPlaces')}</div>
              ) : (
                <>
                  <CommandEmpty>{t('home.noLocationFound')}</CommandEmpty>
                  <CommandGroup>
                    {places.map((place) => (
                      <CommandItem
                        key={place.name}
                        value={place.name}
                        onSelect={() => {
                          onSelect(place.name);
                          setOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4 opacity-0")} />
                        <span>{place.name}</span>
                        <span className="mr-auto text-xs text-muted-foreground font-arabic">{place.nameAr}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button 
        type="button"
        variant={isActive ? "default" : "outline"}
        size="icon"
        className={cn("shrink-0", isActive && "animate-pulse")}
        onClick={onPickOnMap}
        title={t('home.pickOnMap')}
      >
        <MapPin className="h-4 w-4" />
      </Button>
    </div>
  );
}
