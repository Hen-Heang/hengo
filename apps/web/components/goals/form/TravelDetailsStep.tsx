"use client"

import { ArrowLeft, ArrowRight, Car, Compass, Hotel, MapPin } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type GoalFormValues, travelActivities } from "@/lib/goal-form"
import { cn } from "@/lib/utils"

interface TravelDetailsStepProps {
  form: UseFormReturn<GoalFormValues>
  onPrevStep: () => void
  onNextStep: () => void
  selectedActivities: string[]
  toggleActivity: (activity: string) => void
}

export function TravelDetailsStep({
  form,
  onPrevStep,
  onNextStep,
  selectedActivities,
  toggleActivity,
}: TravelDetailsStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">Travel details</h2>
        <p className="mb-3 text-muted-foreground">
          Provide more information about your trip to tailor the plan.
        </p>

        <FormField
          control={form.control}
          name="travel_destination"
          render={({ field }) => (
            <FormItem className="mb-3">
              <FormLabel>
                <MapPin className="mr-1 inline h-4 w-4" />
                Destination
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., Tokyo, Japan or Multiple European cities" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormField
            control={form.control}
            name="travel_accommodation"
            render={({ field }) => (
              <FormItem className="mb-3">
                <FormLabel>
                  <Hotel className="mr-1 inline h-4 w-4" />
                  Accommodation
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select accommodation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="hostel">Hostel</SelectItem>
                    <SelectItem value="airbnb">Airbnb/Rental</SelectItem>
                    <SelectItem value="camping">Camping</SelectItem>
                    <SelectItem value="resort">Resort</SelectItem>
                    <SelectItem value="multiple">Multiple Types</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="travel_transportation"
            render={({ field }) => (
              <FormItem className="mb-3">
                <FormLabel>
                  <Car className="mr-1 inline h-4 w-4" />
                  Transportation
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select transportation method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flight">Flight</SelectItem>
                    <SelectItem value="train">Train</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="bus">Bus</SelectItem>
                    <SelectItem value="cruise">Cruise</SelectItem>
                    <SelectItem value="multiple">Multiple Methods</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="travel_budget"
          render={({ field }) => (
            <FormItem className="mb-3">
              <FormLabel>Budget range</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget ($)</SelectItem>
                  <SelectItem value="moderate">Moderate ($$)</SelectItem>
                  <SelectItem value="luxury">Luxury ($$$)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mb-3">
          <FormLabel>
            <Compass className="mr-1 inline h-4 w-4" />
            Activities &amp; Interests
          </FormLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {travelActivities.map((activity) => {
              const selected = selectedActivities?.includes(activity)
              return (
                <Badge
                  key={activity}
                  variant={selected ? "default" : "outline"}
                  className={cn("cursor-pointer", selected && "bg-primary")}
                  onClick={() => toggleActivity(activity)}
                >
                  {activity}
                  {selected && " ✓"}
                </Badge>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" onClick={onPrevStep} variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button type="button" onClick={onNextStep}>
          Next
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
