
"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import {
  Camera,
  Loader2,
  MapPin,
  Trash2,
  Trees,
  Wrench,
  Send,
  HelpCircle,
  LocateFixed,
} from "lucide-react";
import { PawPrintIcon } from "@/components/icons/logo";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { createComplaint } from "@/app/actions";
import { fileToDataUri } from "@/lib/utils";
import type { ComplaintCategory } from "@/lib/types";

const reportSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(10, { message: "Please provide a more detailed description." }),
  address: z.string().min(10, { message: "Please provide a specific address or landmark." }),
  category: z.enum(["pothole", "tree fall", "garbage", "stray dog", "other"]),
  photo: z.any().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

const categoryIcons: Record<ComplaintCategory, React.ElementType> = {
  pothole: Wrench,
  "tree fall": Trees,
  garbage: Trash2,
  "stray dog": PawPrintIcon,
  other: HelpCircle,
};


export function ReportIssueForm() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | undefined>(undefined);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      description: "",
      address: "",
      category: "other",
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("photo", file);
      const uri = await fileToDataUri(file);
      setPreview(uri);
      setPhotoDataUri(uri);
    }
  };

    const handleLocationDetect = async () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Geolocation is not supported by your browser." });
      return;
    }

    setIsFetchingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        form.setValue("latitude", latitude);
        form.setValue("longitude", longitude);

        try {
          // Using Nominatim for reverse geocoding
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data.display_name) {
            form.setValue("address", data.display_name);
            toast({ title: "Location Detected", description: "Address field has been updated." });
          } else {
            throw new Error("Could not find address.");
          }
        } catch (error) {
          toast({ variant: "destructive", title: "Could not fetch address.", description: "Please enter it manually." });
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        toast({ variant: "destructive", title: "Unable to retrieve your location.", description: error.message });
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };


  const onSubmit = async (values: ReportFormValues) => {
    if (!user || !profile) {
      toast({ variant: "destructive", title: "You must be logged in to report an issue." });
      return;
    }

    if(!values.latitude || !values.longitude){
        toast({ variant: "destructive", title: "Location is required", description: "Please detect your location or enter an address." });
        return;
    }

    const result = await createComplaint({
      ...values,
      photoDataUri,
      userId: user.uid,
      userName: profile.name,
    });

    if (result.error) {
      toast({ variant: "destructive", title: "Failed to report issue", description: result.error });
    } else {
      toast({ title: "Issue Reported Successfully!", description: "Thank you for your contribution." });
      form.reset();
      setPreview(null);
      setPhotoDataUri(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  const category = form.watch("category");
  const CategoryIcon = categoryIcons[category];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report a New Community Issue</CardTitle>
        <CardDescription>
          Fill out the details below to report an issue. Your contribution helps improve our community.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          className="resize-none"
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location / Address</FormLabel>
                      <div className="flex gap-2">
                        <div className="relative flex-grow">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                            <Input className="pl-10" {...field} />
                            </FormControl>
                        </div>
                        <Button type="button" variant="outline" size="icon" onClick={handleLocationDetect} disabled={isFetchingLocation}>
                            {isFetchingLocation ? <Loader2 className="animate-spin" /> : <LocateFixed />}
                            <span className="sr-only">Detect Location</span>
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                       <div className="relative">
                          <CategoryIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="pl-10">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pothole">Pothole</SelectItem>
                              <SelectItem value="tree fall">Tree Fall</SelectItem>
                              <SelectItem value="garbage">Garbage</SelectItem>
                              <SelectItem value="stray dog">Stray Dog</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
              <div className="space-y-2">
                 <FormLabel>Photo of Issue</FormLabel>
                 <FormControl>
                    <Input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} id="photo-upload" />
                 </FormControl>
                <Card 
                    className="aspect-video w-full flex items-center justify-center border-2 border-dashed hover:border-primary transition-colors cursor-pointer"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                >
                    {preview ? (
                        <div className="relative w-full h-full">
                            <Image src={preview} alt="Issue preview" fill className="object-contain rounded-md" />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPreview(null);
                                    setPhotoDataUri(undefined);
                                    form.setValue("photo", null);
                                    if(fileInputRef.current) fileInputRef.current.value = "";
                                }}
                            >
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <Camera className="mx-auto h-12 w-12"/>
                            <p>Click to upload a photo</p>
                        </div>
                    )}
                </Card>
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Submit Report</>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
