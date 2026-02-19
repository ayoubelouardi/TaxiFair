import { motion } from "framer-motion";
import { type EstimateResponse } from "@shared/schema";
import { Moon, CarTaxiFront, Clock, MapPin, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface EstimateCardProps {
  estimate: EstimateResponse | null;
  isLoading: boolean;
}

export function EstimateCard({ estimate, isLoading }: EstimateCardProps) {
  if (isLoading) {
    return (
      <Card className="w-full bg-card/95 backdrop-blur shadow-xl border-border/40">
        <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin text-primary">
            <Calculator className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Calculating best fare...</p>
        </CardContent>
      </Card>
    );
  }

  if (!estimate) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="w-full overflow-hidden bg-card/95 backdrop-blur-md shadow-2xl border-border/60 ring-1 ring-border/40">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-4">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Estimated Fare
            </CardTitle>
            {estimate.isNightFare && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold">
                <Moon className="w-3.5 h-3.5" />
                <span>Night Rate</span>
              </div>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-4xl font-display font-bold text-foreground">
              {estimate.estimatedPrice.toFixed(2)}
            </span>
            <span className="text-lg font-medium text-muted-foreground">
              {estimate.currency}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5" /> Distance
              </div>
              <p className="text-lg font-bold text-foreground font-display">
                {estimate.distanceKm.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">km</span>
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5" /> Duration
              </div>
              <p className="text-lg font-bold text-foreground font-display">
                {Math.round(estimate.durationMin)} <span className="text-sm font-normal text-muted-foreground">min</span>
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Fare Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Base Fare</span>
                <span className="font-medium text-foreground">{estimate.breakdown.baseFare.toFixed(2)} {estimate.currency}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Distance Cost</span>
                <span className="font-medium text-foreground">{estimate.breakdown.distanceFare.toFixed(2)} {estimate.currency}</span>
              </div>
              {estimate.breakdown.nightSurcharge > 0 && (
                <div className="flex justify-between text-primary/80">
                  <span>Night Surcharge</span>
                  <span className="font-medium">+{estimate.breakdown.nightSurcharge.toFixed(2)} {estimate.currency}</span>
                </div>
              )}
              {estimate.breakdown.minimumFareAdjustment !== undefined && estimate.breakdown.minimumFareAdjustment > 0 && (
                <div className="flex justify-between text-amber-600/80">
                  <span>Minimum Fare Adj.</span>
                  <span className="font-medium">+{estimate.breakdown.minimumFareAdjustment.toFixed(2)} {estimate.currency}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="pt-2">
            <p className="text-xs text-center text-muted-foreground/60 italic">
              * Final price may vary due to traffic or route changes.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
