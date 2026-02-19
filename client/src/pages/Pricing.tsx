import { Link } from "wouter";
import { data } from "@/data/pricing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-primary">Pricing & Transport</h1>
            <p className="text-sm text-muted-foreground">Full local dataset</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ThemeToggle />
            <Link href="/" className="text-sm font-medium text-primary hover:underline">
              Back to Estimator
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 sm:px-4 py-6 sm:py-8 space-y-4 sm:space-y-6">
        {data.cities.map((city) => (
          <Card key={city.id} className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span>{city.name}</span>
                <Badge variant="secondary">{city.currencyCode}</Badge>
              </CardTitle>
              <CardDescription>Timezone: {city.timezone}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.transportModes.map((mode) => {
                const profile = data.pricingProfiles.find(
                  (item) => item.cityId === city.id && item.modeId === mode.id && item.active,
                );

                if (!profile) return null;

                const rules = profile.rulesConfig as Record<string, any>;

                return (
                  <div key={mode.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{mode.name}</h3>
                        <p className="text-xs text-muted-foreground">Strategy: {profile.pricingStrategy}</p>
                      </div>
                      <Badge>{mode.slug}</Badge>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="text-muted-foreground">Base Fare</p>
                        <p className="font-semibold">{rules.base_fare} {city.currencyCode}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-muted-foreground">Minimum Fare</p>
                        <p className="font-semibold">{rules.minimum_fare} {city.currencyCode}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-muted-foreground">Distance Step</p>
                        <p className="font-semibold">{rules.distance_step_meters} m</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-muted-foreground">Price per Step</p>
                        <p className="font-semibold">{rules.price_per_step} {city.currencyCode}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-muted-foreground">Night Surcharge</p>
                        <p className="font-semibold">{rules.night_surcharge_percent}%</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-muted-foreground">Night Window</p>
                        <p className="font-semibold">{rules.night_start_hour}:00 → {rules.night_end_hour}:00</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {rules.enabled_rules?.map((rule: string) => (
                        <Badge key={rule} variant="outline">
                          {rule}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
}
