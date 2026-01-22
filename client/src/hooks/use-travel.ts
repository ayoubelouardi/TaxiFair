import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type EstimateRequest, type EstimateResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// Fetch Cities
export function useCities() {
  return useQuery({
    queryKey: [api.config.getCities.path],
    queryFn: async () => {
      const res = await fetch(api.config.getCities.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cities");
      return api.config.getCities.responses[200].parse(await res.json());
    },
  });
}

// Fetch Transport Modes
export function useTransportModes() {
  return useQuery({
    queryKey: [api.config.getModes.path],
    queryFn: async () => {
      const res = await fetch(api.config.getModes.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transport modes");
      return api.config.getModes.responses[200].parse(await res.json());
    },
  });
}

// Calculate Estimate
export function useCalculateEstimate() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: EstimateRequest) => {
      // Validate input using the shared Zod schema before sending
      const validated = api.estimate.calculate.input.parse(data);
      
      const res = await fetch(api.estimate.calculate.path, {
        method: api.estimate.calculate.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.estimate.calculate.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        if (res.status === 404) {
          const error = api.estimate.calculate.responses[404].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to calculate estimate');
      }

      return api.estimate.calculate.responses[200].parse(await res.json());
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
