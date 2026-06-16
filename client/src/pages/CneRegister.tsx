import { useState } from "react";
import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, CalendarClock } from "lucide-react";

const registrationSchema = z
  .object({
    fullName: z.string().min(2, "Please enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().min(5, "Enter a valid phone number"),
    cadre: z.enum(["BSN", "KRCHN", "KRN", "Other"]),
    cadreOther: z.string().optional(),
    higherDiploma: z.string().optional(),
    department: z.string().min(1, "Department is required"),
  })
  .refine((data) => data.cadre !== "Other" || (data.cadreOther?.trim().length ?? 0) > 0, {
    message: "Please specify your cadre",
    path: ["cadreOther"],
  });

type RegistrationValues = z.infer<typeof registrationSchema>;

export default function CneRegister() {
  const params = useParams();
  const institutionId = Number(params.institutionId);
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const currentEventQuery = trpc.cne.currentEvent.useQuery(
    { institutionId },
    { enabled: Number.isInteger(institutionId) && institutionId > 0 }
  );

  const submitMutation = trpc.cne.submitRegistration.useMutation();

  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      cadre: "KRCHN",
      cadreOther: "",
      higherDiploma: "",
      department: "",
    },
  });

  const cadre = form.watch("cadre");

  const onSubmit = async (values: RegistrationValues) => {
    try {
      await submitMutation.mutateAsync({
        institutionId,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        cadre: values.cadre,
        cadreOther: values.cadre === "Other" ? values.cadreOther : undefined,
        higherDiploma: values.higherDiploma || undefined,
        department: values.department,
      });
      setSubmitted(true);
      form.reset();
    } catch (error) {
      toast({
        title: "Registration failed",
        description: (error as Error).message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!Number.isInteger(institutionId) || institutionId <= 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Invalid registration link</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This CNE registration link is not valid. Please scan the QR code provided by your
          institution.
        </p>
      </div>
    );
  }

  const event = currentEventQuery.data?.event ?? null;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader className="text-center">
          {event?.institutionName ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
              {event.institutionName}
            </p>
          ) : null}
          <CardTitle className="text-xl">Continuing Nursing Education</CardTitle>
          <p className="text-sm text-muted-foreground">Attendance Registration</p>
        </CardHeader>
        <CardContent>
          {currentEventQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : submitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
              <p className="text-lg font-semibold">You're registered!</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Your attendance has been recorded. Your certificate will be issued by the CNE
                coordinator.
              </p>
              <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>
                Register another nurse
              </Button>
            </div>
          ) : !event ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CalendarClock className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-semibold">Registration is closed</p>
              <p className="mt-2 text-sm text-muted-foreground">
                There is no CNE event open for registration right now. Please check with your CNE
                coordinator.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 rounded-md bg-muted/50 p-3 text-center">
                <p className="text-sm font-semibold">{event.name}</p>
                <p className="text-xs text-muted-foreground">{event.eventDate}</p>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Jane Wanjiku Mwangi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+2547XXXXXXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cadre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cadre *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your cadre" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="BSN">BSN</SelectItem>
                            <SelectItem value="KRCHN">KRCHN</SelectItem>
                            <SelectItem value="KRN">KRN</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {cadre === "Other" ? (
                    <FormField
                      control={form.control}
                      name="cadreOther"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specify Cadre *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Clinical Officer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}
                  <FormField
                    control={form.control}
                    name="higherDiploma"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Higher Diploma / Specialty</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Paediatric Critical Care" {...field} />
                        </FormControl>
                        <FormDescription>Optional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. PICU, Newborn Unit, Ward 3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Register Attendance
                  </Button>
                </form>
              </Form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
