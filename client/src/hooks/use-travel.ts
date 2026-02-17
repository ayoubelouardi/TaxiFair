import { useQuery, useMutation } from "@tanstack/react-query";
import { estimateFare } from "@/lib/estimate";
import { getCities, getTransportModes } from "@/data/pricing";
import { getPlacesByCity } from "@/data/places";
import { estimateRequestSchema, type EstimateRequest, type EstimateResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Fetch Cities
export function useCities() {
  return useQuery({
    queryKey: ["local", "cities"],
    queryFn: async () => {
      return getCities();
    },
  });
}

// Fetch Transport Modes
export function useTransportModes() {
  return useQuery({
    queryKey: ["local", "transport-modes"],
    queryFn: async () => {
      return getTransportModes();
    },
  });
}

// Fetch Places by City
export function usePlaces(citySlug: string) {
  return useQuery({
    queryKey: ["local", "places", citySlug],
    queryFn: async () => {
      return getPlacesByCity(citySlug);
    },
    enabled: !!citySlug,
  });
}

// Calculate Estimate
export function useCalculateEstimate() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: EstimateRequest) => {
      const validated = estimateRequestSchema.parse(data);
      const estimate = estimateFare(validated);
      return estimate as EstimateResponse;
    },
    onError: (error) => {
      toast({
        title: "Calculation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
