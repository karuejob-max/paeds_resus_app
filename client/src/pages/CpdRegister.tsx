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
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
    facilityDepartmentId: z.number().int().positive().nullable().optional(),
    facilityRelationship: z.enum(["permanent_facility", "locum_outreach"]),
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
  const requestedEventId = typeof window !== "undefined"
    ? Number(new URLSearchParams(window.location.search).get("eventId") || 0) || undefined
    : undefined;
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const { user, loading: authLoading, sessionSettled } = useAuth();

  const currentEventQuery = trpc.cpd.currentEvent.useQuery(
    { institutionId, eventId: requestedEventId },
    { enabled: Number.isInteger(institutionId) && institutionId > 0 }
  );
  const myMembershipsQuery = trpc.institution.getMyMemberships.useQuery();

  const submitMutation = trpc.cpd.submitRegistration.useMutation();
  const checkInMutation = trpc.cpd.checkInSelf.useMutation({
    onSuccess: () => {
      setCheckedIn(true);
      toast({
        title: "Check-in recorded",
        description: "Your attendance is now awaiting CPD coordinator verification.",
      });
    },
    onError: error => {
      toast({
        title: "Check-in failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
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
      facilityDepartmentId: null,
      facilityRelationship: "permanent_facility",
    },
  });

  useEffect(() => {
    if (user) {
      const uCadre = (user as any).cadre ?? "";
      const uCadreOther = (user as any).cadreOther ?? "";

      const isStandardSub = ALL_STANDARD_SPECIALTIES.includes(uCadreOther);
      const prefillDept = currentEventQuery.data?.userDepartment || "";
      const prefillDepartmentId = currentEventQuery.data?.userFacilityDepartmentId ?? null;

      form.reset({
        fullName: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        cadre: uCadre,
        cadreOther: (uCadreOther && !isStandardSub) ? uCadreOther : "",
        subSpecialty: isStandardSub ? uCadreOther : "",
        department: prefillDept,
        facilityDepartmentId: prefillDepartmentId,
        facilityRelationship: myMembershipsQuery.data?.some(
          (membership) => membership.membershipStatus === "active" && membership.institutionalAccountId !== institutionId,
        ) ? "locum_outreach" : "permanent_facility",
      });
    }
  }, [user, form, institutionId, myMembershipsQuery.data, currentEventQuery.data?.userDepartment, currentEventQuery.data?.userFacilityDepartmentId]);

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
        eventId: requestedEventId,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        cadre: values.cadre,
        cadreOther: finalCadreOther,
        department: values.department,
        facilityDepartmentId: values.facilityDepartmentId ?? null,
        facilityRelationship: values.facilityRelationship,
      });
      setCheckedIn(false);
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
                window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
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
  const existingAttendee = currentEventQuery.data?.myAttendee ?? null;

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
                Your registration has been recorded. Check in for this exact event, then the CPD
                coordinator will verify attendance before a certificate can be issued.
              </p>
              {submitMutation.data?.attendeeId && submitMutation.data?.eventId ? (
                checkedIn ? (
                  <p className="mt-4 rounded-md bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-800">
                    Check-in recorded. Your coordinator must verify attendance before CPD points or a certificate are issued.
                  </p>
                ) : (
                  <Button
                    className="mt-4 w-full"
                    onClick={() => checkInMutation.mutate({
                      attendeeId: submitMutation.data.attendeeId,
                      eventId: submitMutation.data.eventId,
                    })}
                    disabled={checkInMutation.isPending}
                  >
                    {checkInMutation.isPending ? "Checking in…" : "Check in for this event"}
                  </Button>
                )
              ) : null}
              {submitMutation.data?.facilityLinkStatus === "linked" && submitMutation.data?.facilityRelationship !== "locum_outreach" ? (
                <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-800">
                  This hospital is now linked to your account as general staff. It is recorded as your primary facility; any IERS duty still requires a separate institutional assignment and your explicit acceptance.
                </p>
              ) : submitMutation.data?.facilityRelationship === "locum_outreach" && submitMutation.data?.facilityLinkStatus === "linked" ? (
                <p className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-800">
                  This hospital is now linked to your account as a locum/outreach facility. Your primary facility was not changed, but this facility is included in your facility history; any IERS duty still requires a separate institutional assignment and your explicit acceptance.
                </p>
              ) : submitMutation.data?.facilityLinkStatus === "admin_review_required" ? (
                <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                  Attendance was recorded, but this facility relationship needs administrator review before it can become an active institutional link.
                </p>
              ) : null}
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
              {existingAttendee ? (
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <p className="font-semibold">You are already registered for this event.</p>
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                    <span>Attendance status:</span>
                    <Badge variant={existingAttendee.attendanceStatus === "attendance_verified" ? "default" : "secondary"}>
                      {existingAttendee.attendanceStatus.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  {existingAttendee.attendanceStatus === "attendance_verified" ? (
                    <p className="mt-3 text-xs text-muted-foreground">Attendance has been verified. Your CPD certificate will be available after issuance.</p>
                  ) : existingAttendee.attendanceStatus === "cancelled" || existingAttendee.attendanceStatus === "excused" ? (
                    <p className="mt-3 text-xs text-muted-foreground">This attendance record is not eligible for CPD points or a certificate.</p>
                  ) : (
                    <Button
                      type="button"
                      className="mt-4 w-full"
                      onClick={() => event && checkInMutation.mutate({ attendeeId: existingAttendee.attendeeId, eventId: event.id })}
                      disabled={!event || !event.isOpen || ["closed", "archived", "voided", "cancelled", "certificates_issued"].includes(event.lifecycleStatus ?? "") || checkInMutation.isPending}
                    >
                      {checkInMutation.isPending ? "Checking in…" : "Check in for this event"}
                    </Button>
                  )}
                </div>
              ) : (
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
                    render={({ field }) => {
                      const registrationDepartments = currentEventQuery.data?.registrationDepartments ?? [];
                      const selectedDepartment = registrationDepartments.find(
                        (department) => department.departmentName === field.value,
                      );

                      return (
                        <FormItem>
                          <FormLabel>Institution Department *</FormLabel>
                          {registrationDepartments.length > 0 ? (
                            <>
                              <Select
                                value={selectedDepartment ? String(selectedDepartment.id) : undefined}
                                onValueChange={(departmentId) => {
                                  const department = registrationDepartments.find((item) => item.id === Number(departmentId));
                                  field.onChange(department?.departmentName ?? "");
                                  form.setValue("facilityDepartmentId", department?.id ?? null, { shouldValidate: true });
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select your IERS department" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>IERS departments</SelectLabel>
                                    {registrationDepartments.map((department) => (
                                      <SelectItem key={department.id} value={String(department.id)}>
                                        {department.departmentName}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                              <p className="text-[11px] leading-relaxed text-muted-foreground">
                                This list is maintained by the institution’s IERS lead. It keeps CPD staff-performance data and emergency-readiness departments aligned.
                              </p>
                            </>
                          ) : (
                            <FormControl>
                              <DepartmentSelectors value={field.value} onChange={field.onChange} />
                            </FormControl>
                          )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="facilityRelationship"
                    render={({ field }) => (
                      <FormItem className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                        <FormLabel>How does this institution relate to your work? *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="mt-2 space-y-3"
                          >
                            <label className="flex cursor-pointer items-start gap-2.5">
                              <RadioGroupItem value="permanent_facility" className="mt-0.5" />
                              <span>
                                <span className="block text-sm font-medium">My permanent facility</span>
                                <span className="block text-xs leading-relaxed text-muted-foreground">
                                  Link this hospital to your account as general staff and set it as your primary facility. IERS duties still require separate institutional assignment and your explicit acceptance.
                                </span>
                              </span>
                            </label>
                            <label className="flex cursor-pointer items-start gap-2.5">
                              <RadioGroupItem value="locum_outreach" className="mt-0.5" />
                              <span>
                                <span className="block text-sm font-medium">Outreach / locum facility</span>
                                <span className="block text-xs leading-relaxed text-muted-foreground">
                                  Link this hospital to your account as a locum/outreach facility without changing your primary facility. IERS duties still require separate institutional assignment and your explicit acceptance.
                                </span>
                              </span>
                            </label>
                          </RadioGroup>
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
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
