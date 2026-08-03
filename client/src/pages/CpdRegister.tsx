import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, CalendarClock, AlertCircle } from "lucide-react";
import { DepartmentSelectors } from "@/components/DepartmentSelectors";
import CadreProgressiveSelector from "@/components/CadreProgressiveSelector";
import { ALL_STANDARD_SPECIALTIES } from "@/lib/cadre-taxonomy";

const registrationSchema = z
  .object({
    fullName: z.string().min(2, "Please enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().min(5, "Enter a valid phone number"),
    cadre: z.string().min(1, "Select your professional cadre"),
    cadreOther: z.string().optional(),
    subSpecialty: z.string().optional(),
    department: z.string().min(1, "Department is required"),
  })
  .refine(
    (data) => {
      const requiresOther = ["Other Staff", "Other Intern", "Other Student"].includes(data.cadre);
      if (requiresOther && !data.cadreOther?.trim()) return false;
      if (data.subSpecialty === "Other" && !data.cadreOther?.trim()) return false;
      return true;
    },
    {
      message: "Please specify details",
      path: ["cadreOther"],
    }
  )
  .refine(
    (data) => {
      const hasSubspecialty = [
        "Consultant Physician",
        "MSN",
        "HND",
        "Consultant Physician Student",
        "MSN Student",
        "HND Student",
        "RCO HND",
      ].includes(data.cadre);
      if (hasSubspecialty && !data.subSpecialty?.trim()) return false;
      return true;
    },
    {
      message: "Highest qualification subspecialty is required",
      path: ["subSpecialty"],
    }
  );

type RegistrationValues = z.infer<typeof registrationSchema>;

export default function CpdRegister() {
  const params = useParams();
  const institutionId = Number(params.institutionId);
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const { user, loading: authLoading, sessionSettled } = useAuth();

  const currentEventQuery = trpc.cpd.currentEvent.useQuery(
    { institutionId },
    { enabled: Number.isInteger(institutionId) && institutionId > 0 }
  );

  const submitMutation = trpc.cpd.submitRegistration.useMutation();
  const utils = trpc.useUtils();
  const updateProfileMutation = trpc.auth.updateMyProfile.useMutation({
    onSuccess: async () => {
      toast({
        title: "Profile updated",
        description: "Your professional cadre has been updated in your profile settings.",
      });
      await utils.auth.me.invalidate();
    },
    onError: (err) => {
      toast({
        title: "Profile update failed",
        description: err.message,
        variant: "destructive",
      });
    }
  });

  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      cadre: "",
      cadreOther: "",
      subSpecialty: "",
      department: "",
    },
  });

  useEffect(() => {
    if (user) {
      const uCadre = (user as any).cadre ?? "";
      const uCadreOther = (user as any).cadreOther ?? "";

      const isStandardSub = ALL_STANDARD_SPECIALTIES.includes(uCadreOther);
      const prefillDept = currentEventQuery.data?.userDepartment || "";

      form.reset({
        fullName: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        cadre: uCadre,
        cadreOther: (uCadreOther && !isStandardSub) ? uCadreOther : "",
        subSpecialty: isStandardSub ? uCadreOther : "",
        department: prefillDept,
      });
    }
  }, [user, form, currentEventQuery.data?.userDepartment]);

  const cadre = form.watch("cadre");
  const cadreOther = form.watch("cadreOther");
  const subSpecialty = form.watch("subSpecialty");

  const onSubmit = async (values: RegistrationValues) => {
    try {
      const requiresOther = ["Other Staff", "Other Intern", "Other Student"].includes(values.cadre);
      const hasSubspecialty = [
        "Consultant Physician",
        "MSN",
        "HND",
        "Consultant Physician Student",
        "MSN Student",
        "HND Student",
        "RCO HND",
      ].includes(values.cadre);

      let finalCadreOther = undefined;
      if (requiresOther) {
        finalCadreOther = values.cadreOther;
      } else if (hasSubspecialty) {
        finalCadreOther = values.subSpecialty === "Other" ? values.cadreOther : values.subSpecialty;
      }

      await submitMutation.mutateAsync({
        institutionId,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        cadre: values.cadre,
        cadreOther: finalCadreOther,
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
          This CPD registration link is not valid. Please scan the QR code provided by your
          institution.
        </p>
      </div>
    );
  }

  if (authLoading || !sessionSettled) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card className="border-amber-100 bg-amber-50/10">
          <CardHeader className="text-center">
            <CardTitle className="text-lg text-slate-800 font-bold">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-slate-600">
              To prevent proxy registration, you must be signed in to your Paeds Resus
              account on this device to check-in for the CPD event.
            </p>
            <Button
              className="w-full mt-2"
              onClick={() => {
                window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
              }}
            >
              Sign In to Register
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const event = currentEventQuery.data?.event ?? null;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="text-center pb-2">
          {event?.institutionName ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              {event.institutionName}
            </p>
          ) : null}
          <CardTitle className="text-xl">Continuous Professional Development (CPD)</CardTitle>
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
                Your attendance has been recorded. Your certificate will be issued by the CPD
                coordinator.
              </p>
              <div className="flex flex-col gap-2.5 mt-6 w-full">
                <Button className="w-full" onClick={() => window.location.href = "/my-cpd-certificates"}>
                  View My CPD Certificates
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  To prevent proxy registration, you can only register your own account.
                </p>
              </div>
            </div>
          ) : !event ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CalendarClock className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-semibold">Registration is closed</p>
              <p className="mt-2 text-sm text-muted-foreground">
                There is no CPD event open for registration right now. Please check with your CPD
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
                          <Input type="email" placeholder="you@example.com" {...field} disabled className="bg-slate-50 cursor-not-allowed text-slate-500" />
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
                      <FormItem className="space-y-0">
                        <FormControl>
                          <CadreProgressiveSelector
                            value={field.value}
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            cadreOtherValue={form.watch("cadreOther") || ""}
                            onCadreOtherChange={(val) => form.setValue("cadreOther", val)}
                            subSpecialtyValue={form.watch("subSpecialty") || ""}
                            onSubSpecialtyChange={(val) => form.setValue("subSpecialty", val)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Soft profile nudge */}
                  {(() => {
                    const userCadre = (user as any)?.cadre ?? "";
                    const userCadreOther = (user as any)?.cadreOther ?? "";
                    const requiresOther = ["Other Staff", "Other Intern", "Other Student"].includes(cadre);
                    const hasSubspecialty = ["Consultant Physician", "MSN", "HND", "Consultant Physician Student", "MSN Student", "HND Student", "RCO HND"].includes(cadre);
                    
                    let currentCadreOther = "";
                    if (requiresOther) {
                      currentCadreOther = cadreOther || "";
                    } else if (hasSubspecialty) {
                      currentCadreOther = subSpecialty === "Other" ? (cadreOther || "") : (subSpecialty || "");
                    }

                    const isDifferent = cadre && (cadre !== userCadre || currentCadreOther !== userCadreOther);

                    if (!isDifferent) return null;

                    return (
                      <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900/30 dark:bg-blue-950/20">
                        <div className="flex gap-2.5">
                          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                              Cadre Profile Alignment
                            </p>
                            <p className="text-[11px] leading-relaxed text-blue-700/90 dark:text-blue-400/90">
                              Your selected cadre differs from (or is missing on) your profile. Update your Paeds Resus profile cadre so other features on the platform reflect your correct qualifications?
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-[11px] font-medium border-blue-200 bg-white hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:bg-slate-950 dark:hover:bg-slate-900"
                              disabled={updateProfileMutation.isPending}
                              onClick={() => {
                                updateProfileMutation.mutate({
                                  name: user?.name || "",
                                  cadre: cadre,
                                  cadreOther: currentCadreOther || null,
                                });
                              }}
                            >
                              {updateProfileMutation.isPending ? "Updating..." : "Update Profile Cadre"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <DepartmentSelectors
                            value={field.value}
                            onChange={field.onChange}
                          />
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
