import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Loader2, Search, Check, ChevronsUpDown, Sun, Moon } from "lucide-react";

import { useCities, useTransportModes, useCalculateEstimate } from "@/hooks/use-travel";
import { MapBackground } from "@/components/MapBackground";
import { EstimateCard } from "@/components/EstimateCard";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  citySlug: z.string().min(1, "Please select a city"),
  modeSlug: z.string().min(1, "Please select a transport mode"),
  originLat: z.string().refine((val) => !isNaN(parseFloat(val)), "Invalid latitude"),
  originLng: z.string().refine((val) => !isNaN(parseFloat(val)), "Invalid longitude"),
  destLat: z.string().refine((val) => !isNaN(parseFloat(val)), "Invalid latitude"),
  destLng: z.string().refine((val) => !isNaN(parseFloat(val)), "Invalid longitude"),
  isNight: z.boolean().default(false),
});

const DEMO_LOCATIONS = {
  casablanca: {
    "Casa Port": { lat: 33.5992, lng: -7.6192 },
    "Morocco Mall": { lat: 33.5753, lng: -7.7061 },
    "Hassan II Mosque": { lat: 33.6080, lng: -7.6324 },
    "Technopark": { lat: 33.5504, lng: -7.6534 },
    "Maarif": { lat: 33.5768, lng: -7.6366 },
    "Anfa Place Shopping Center": { lat: 33.5983, lng: -7.6644 },
    "Twin Center": { lat: 33.5878, lng: -7.6324 },
    "Casablanca Finance City": { lat: 33.5670, lng: -7.6600 },
    "Place des Nations Unies": { lat: 33.5954, lng: -7.6186 },
    "Parc de la Ligue Arabe": { lat: 33.5870, lng: -7.6240 },
    "Quartier Habous": { lat: 33.5750, lng: -7.6050 },
    "Cathédrale du Sacré-Cœur": { lat: 33.5910, lng: -7.6210 },
    "Villa des Arts": { lat: 33.5880, lng: -7.6310 },
    "Museum of Moroccan Judaism": { lat: 33.5410, lng: -7.6520 },
    "La Corniche": { lat: 33.5960, lng: -7.6650 },
    "Ain Diab Beach": { lat: 33.5850, lng: -7.6950 },
    "Derb Sultan": { lat: 33.5650, lng: -7.6050 },
    "Gauthier": { lat: 33.5890, lng: -7.6290 },
    "Palais Royal": { lat: 33.5760, lng: -7.6010 },
    "Central Market": { lat: 33.5940, lng: -7.6140 },
    "L'Oasis Station": { lat: 33.5550, lng: -7.6340 },
    "Casa Voyageurs Station": { lat: 33.5890, lng: -7.5920 },
    "Mohammed V International Airport": { lat: 33.3675, lng: -7.5898 },
    "Sindibad Park": { lat: 33.5820, lng: -7.6850 },
    "Club des Pins": { lat: 33.5990, lng: -7.6580 },
    "Sidi Maarouf": { lat: 33.5350, lng: -7.6450 },
    "Bouskoura Forest": { lat: 33.4650, lng: -7.6150 },
    "Tamaris": { lat: 33.5250, lng: -7.8250 },
    "Mohammedia": { lat: 33.6850, lng: -7.3850 },
    "Mediouna": { lat: 33.4550, lng: -7.5150 },
    "Dar Bouazza": { lat: 33.5150, lng: -7.8150 },
    "Zenata": { lat: 33.6350, lng: -7.4950 },
    "Tit Mellil": { lat: 33.5550, lng: -7.4750 },
    "Nouaceur": { lat: 33.3550, lng: -7.5950 },
    "Berrechid": { lat: 33.2650, lng: -7.5850 }
  }
};

export default function Home() {
  const [selectedOrigin, setSelectedOrigin] = useState<{lat: number, lng: number} | undefined>();
  const [selectedDest, setSelectedDest] = useState<{lat: number, lng: number} | undefined>();
  const [selectionMode, setSelectionMode] = useState<'origin' | 'destination' | null>(null);

  const [originName, setOriginName] = useState("");
  const [destName, setDestName] = useState("");

  const { data: cities, isLoading: loadingCities } = useCities();
  const { data: modes, isLoading: loadingModes } = useTransportModes();
  const estimateMutation = useCalculateEstimate();

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
    const coords = DEMO_LOCATIONS.casablanca[name as keyof typeof DEMO_LOCATIONS.casablanca];
    if (type === 'origin') {
      form.setValue("originLat", coords.lat.toString());
      form.setValue("originLng", coords.lng.toString());
      setSelectedOrigin(coords);
      setOriginName(name);
    } else {
      form.setValue("destLat", coords.lat.toString());
      form.setValue("destLng", coords.lng.toString());
      setSelectedDest(coords);
      setDestName(name);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col md:flex-row">
      <div className="absolute inset-0 w-full h-full">
        <MapBackground 
          origin={selectedOrigin} 
          destination={selectedDest} 
          onMapClick={handleMapClick}
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
            <h1 className="text-2xl font-display font-bold text-primary">TaxiFair</h1>
            <p className="text-sm text-muted-foreground">Professional fare estimator for Casablanca</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-xl border-white/50 bg-white/95 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Get an Estimate</CardTitle>
                <CardDescription>Enter your trip details below</CardDescription>
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
                            <FormLabel className="text-xs uppercase font-semibold text-muted-foreground">City</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-50 border-slate-200">
                                  <SelectValue placeholder="Select City" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {loadingCities ? (
                                  <div className="p-2 text-xs text-center text-muted-foreground">Loading...</div>
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
                            <FormLabel className="text-xs uppercase font-semibold text-muted-foreground">Mode</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-50 border-slate-200">
                                  <SelectValue placeholder="Transport" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {loadingModes ? (
                                  <div className="p-2 text-xs text-center text-muted-foreground">Loading...</div>
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
                        <FormLabel className="text-sm font-medium">Night Pricing</FormLabel>
                        <p className="text-xs text-muted-foreground">Toggle night rate surcharge</p>
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
                          <div className="w-2 h-2 rounded-full bg-primary" /> Origin
                        </FormLabel>
                        <div className="flex gap-2">
                          <LocationSearch 
                            placeholder="Search or pick on map..."
                            selectedValue={originName}
                            onSelect={(name) => setDemoLocation('origin', name)}
                            onPickOnMap={() => setSelectionMode('origin')}
                            isActive={selectionMode === 'origin'}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <FormLabel className="flex items-center gap-2 text-sm font-medium">
                          <div className="w-2 h-2 rounded-full bg-accent" /> Destination
                        </FormLabel>
                        <div className="flex gap-2">
                          <LocationSearch 
                            placeholder="Search or pick on map..."
                            selectedValue={destName}
                            onSelect={(name) => setDemoLocation('dest', name)}
                            onPickOnMap={() => setSelectionMode('destination')}
                            isActive={selectionMode === 'destination'}
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
                          Calculating...
                        </>
                      ) : (
                        "Calculate Fare"
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
      
      <div className="hidden md:block absolute bottom-4 right-4 z-10 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs text-muted-foreground border border-white/50">
        © {new Date().getFullYear()} TaxiFair. Map data © OpenStreetMap.
      </div>
    </div>
  );
}

function LocationSearch({ 
  placeholder, 
  selectedValue,
  onSelect, 
  onPickOnMap,
  isActive
}: { 
  placeholder: string; 
  selectedValue: string;
  onSelect: (name: string) => void; 
  onPickOnMap: () => void;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const locations = Object.keys(DEMO_LOCATIONS.casablanca);

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
            <CommandInput placeholder="Search location..." />
            <CommandList>
              <CommandEmpty>No location found.</CommandEmpty>
              <CommandGroup>
                {locations.map((loc) => (
                  <CommandItem
                    key={loc}
                    value={loc}
                    onSelect={() => {
                      onSelect(loc);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4 opacity-0")} />
                    {loc}
                  </CommandItem>
                ))}
              </CommandGroup>
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
        title="Pick on map"
      >
        <MapPin className="h-4 w-4" />
      </Button>
    </div>
  );
}
