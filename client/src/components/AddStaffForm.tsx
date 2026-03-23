import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const staffFormSchema = z.object({
  staffName: z.string().min(2, "Name must be at least 2 characters"),
  staffEmail: z.string().email("Invalid email address"),
  staffPhone: z.string().optional(),
  staffRole: z.enum(["doctor", "nurse", "paramedic", "midwife", "lab_tech", "respiratory_therapist", "support_staff", "other"]),
  department: z.string().optional(),
  yearsOfExperience: z.number().min(0).optional(),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

interface AddStaffFormProps {
  institutionId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddStaffForm({ institutionId, open, onOpenChange, onSuccess }: AddStaffFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      staffName: "",
      staffEmail: "",
      staffPhone: "",
      staffRole: "nurse",
      department: "",
      yearsOfExperience: 0,
    },
  });

  const addStaffMutation = trpc.institution.addStaffMember.useMutation();

  const onSubmit = async (data: StaffFormValues) => {
    setIsSubmitting(true);
    try {
      await addStaffMutation.mutateAsync({
        institutionId,
        ...data,
        yearsOfExperience: data.yearsOfExperience || 0,
      });

      setShowSuccess(true);
      toast({
        title: "Success",
        description: `${data.staffName} has been added successfully`,
      });

      form.reset();
      setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
        onSuccess?.();
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to add staff member",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Add a new staff member to your institution
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-semibold">Staff member added successfully!</p>
            <p className="text-sm text-muted-foreground mt-2">Redirecting...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="staffName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="staffEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@hospital.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone Field */}
              <FormField
                control={form.control}
                name="staffPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+254712345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role Field */}
              <FormField
                control={form.control}
                name="staffRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="paramedic">Paramedic</SelectItem>
                        <SelectItem value="midwife">Midwife</SelectItem>
                        <SelectItem value="lab_tech">Lab Technician</SelectItem>
                        <SelectItem value="respiratory_therapist">Respiratory Therapist</SelectItem>
                        <SelectItem value="support_staff">Support Staff</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Department Field */}
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ICU, Emergency, Ward" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional: Specify the department or unit
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Years of Experience Field */}
              <FormField
                control={form.control}
                name="yearsOfExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Staff Member
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
