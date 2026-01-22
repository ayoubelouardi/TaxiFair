import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Calendar, Loader2 } from "lucide-react";

import { useCities, useTransportModes, useCalculateEstimate } from "@/hooks/use-travel";
import { MapBackground } from "@/components/MapBackground";
import { EstimateCard } from "@/components/EstimateCard";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Extending schema for form specific fields if needed, 
// but mostly mapping directly to API schema
const formSchema = z.object({
  citySlug: z.string().min(1, "Please select a city"),
  modeSlug: z.string().min(1, "Please select a transport mode"),
  originLat: z.string().refine((val) => !isNaN(parseFloat(val)), "Invalid latitude"),
  originLng: z.string().refine((val) => !isNaN(parseFloat(val)), "Invalid longitude"),
  destLat: z.string().refine((val) => !isNaN(parseFloat(val)), "Invalid latitude"),
  destLng: z.string().refine((val) => !isNaN(parseFloat(val)), "Invalid longitude"),
});

// Hardcoded coordinates for demo simplicity 
// In a real app, we'd use a Geocoding API/Component
const DEMO_LOCATIONS = {
  casablanca: {
    "Casa Port": { lat: 33.5992, lng: -7.6192 },
    "Morocco Mall": { lat: 33.5753, lng: -7.7061 },
    "Hassan II Mosque": { lat: 33.6080, lng: -7.6324 },
    "Technopark": { lat: 33.5504, lng: -7.6534 },
    "Maarif": { lat: 33.5768, lng: -7.6366 }
  }
};

export default function Home() {
  const [selectedOrigin, setSelectedOrigin] = useState<{lat: number, lng: number} | undefined>();
  const [selectedDest, setSelectedDest] = useState<{lat: number, lng: number} | undefined>();

  const { data: cities, isLoading: loadingCities } = useCities();
  const { data: modes, isLoading: loadingModes } = useTransportModes();
  const estimateMutation = useCalculateEstimate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      citySlug: "",
      modeSlug: "",
      originLat: "33.5992", // Default to Casa Port
      originLng: "-7.6192",
      destLat: "33.5753",   // Default to Morocco Mall
      destLng: "-7.7061",
    },
  });

  // Watch values to update map markers
  const originLat = form.watch("originLat");
  const originLng = form.watch("originLng");
  const destLat = form.watch("destLat");
  const destLng = form.watch("destLng");

  // Update map state when valid coordinates are entered
  const handleCoordUpdate = () => {
    const oLat = parseFloat(originLat);
    const oLng = parseFloat(originLng);
    const dLat = parseFloat(destLat);
    const dLng = parseFloat(destLng);

    if (!isNaN(oLat) && !isNaN(oLng)) setSelectedOrigin({ lat: oLat, lng: oLng });
    if (!isNaN(dLat) && !isNaN(dLng)) setSelectedDest({ lat: dLat, lng: dLng });
  };

  // Initial map set on load
  useState(() => {
    handleCoordUpdate();
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    estimateMutation.mutate({
      citySlug: data.citySlug,
      transportModeSlug: data.modeSlug,
      originLat: parseFloat(data.originLat),
      originLng: parseFloat(data.originLng),
      destLat: parseFloat(data.destLat),
      destLng: parseFloat(data.destLng),
      travelTime: new Date().toISOString(),
    });
  };

  // Helper to pre-fill coordinates from demo locations
  const setDemoLocation = (type: 'origin' | 'dest', name: keyof typeof DEMO_LOCATIONS.casablanca) => {
    const coords = DEMO_LOCATIONS.casablanca[name];
    if (type === 'origin') {
      form.setValue("originLat", coords.lat.toString());
      form.setValue("originLng", coords.lng.toString());
      setSelectedOrigin(coords);
    } else {
      form.setValue("destLat", coords.lat.toString());
      form.setValue("destLng", coords.lng.toString());
      setSelectedDest(coords);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col md:flex-row">
      {/* --- Map Layer --- */}
      <div className="absolute inset-0 w-full h-full">
        <MapBackground origin={selectedOrigin} destination={selectedDest} />
      </div>

      {/* --- Floating UI Panel --- */}
      <div className="relative z-10 w-full md:w-[450px] h-full flex flex-col pointer-events-none">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pointer-events-auto">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/50"
          >
            <h1 className="text-2xl font-display font-bold text-primary">TaxiFair</h1>
            <p className="text-sm text-muted-foreground">Professional fare estimator for Casablanca</p>
          </motion.div>

          {/* Main Form */}
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
                    
                    {/* Location Config */}
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

                    <div className="h-px bg-slate-100 my-2" />

                    {/* Coordinates - For MVP simplicity using Select for predefined spots + Input for coords */}
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <FormLabel className="flex items-center gap-2 text-sm font-medium">
                          <div className="w-2 h-2 rounded-full bg-primary" /> Origin
                        </FormLabel>
                        <div className="flex gap-2">
                          <Select onValueChange={(val) => setDemoLocation('origin', val as any)}>
                            <SelectTrigger className="flex-1 bg-slate-50">
                              <SelectValue placeholder="Quick Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(DEMO_LOCATIONS.casablanca).map(loc => (
                                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="originLat"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="Lat" className="text-xs font-mono h-8" onChange={(e) => {field.onChange(e); handleCoordUpdate();}} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="originLng"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="Lng" className="text-xs font-mono h-8" onChange={(e) => {field.onChange(e); handleCoordUpdate();}} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <FormLabel className="flex items-center gap-2 text-sm font-medium">
                          <div className="w-2 h-2 rounded-full bg-accent" /> Destination
                        </FormLabel>
                        <div className="flex gap-2">
                          <Select onValueChange={(val) => setDemoLocation('dest', val as any)}>
                            <SelectTrigger className="flex-1 bg-slate-50">
                              <SelectValue placeholder="Quick Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(DEMO_LOCATIONS.casablanca).map(loc => (
                                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="destLat"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="Lat" className="text-xs font-mono h-8" onChange={(e) => {field.onChange(e); handleCoordUpdate();}} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="destLng"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="Lng" className="text-xs font-mono h-8" onChange={(e) => {field.onChange(e); handleCoordUpdate();}} />
                                </FormControl>
                              </FormItem>
                            )}
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
          
          {/* Result Section */}
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
      
      {/* --- Simple Footer/Copyright for Desktop --- */}
      <div className="hidden md:block absolute bottom-4 right-4 z-10 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs text-muted-foreground border border-white/50">
        © {new Date().getFullYear()} TaxiFair. Map data © OpenStreetMap.
      </div>
    </div>
  );
}
