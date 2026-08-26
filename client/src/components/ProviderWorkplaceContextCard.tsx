import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FacilityPicker, type FacilitySelection } from "./FacilityPicker";
import { DepartmentSelectors } from "./DepartmentSelectors";

export function ProviderWorkplaceContextCard() {
  const profileQuery = trpc.provider.getProfile.useQuery(undefined, {
    staleTime: 30_000,
  });
  const linkedDepartmentsQuery =
    trpc.institution.getMyLinkedFacilityDepartments.useQuery(undefined, {
      staleTime: 30_000,
    });
  const updateProfileMutation = trpc.provider.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Workplace context saved.");
      void profileQuery.refetch();
      void linkedDepartmentsQuery.refetch();
    },
    onError: error =>
      toast.error(error.message || "Could not save workplace context."),
  });
  const [facility, setFacility] = useState<FacilitySelection | null>(null);
  const [department, setDepartment] = useState("");

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    setFacility(
      profile.facilityId && profile.facilityName
        ? {
            facilityId: profile.facilityId,
            facilityName: profile.facilityName,
            county: profile.facilityRegion ?? null,
            country: profile.facilityCountry ?? "Kenya",
          }
        : null
    );
    setDepartment(profile.department ?? "");
  }, [profileQuery.data]);

  const selectedLinkedDepartment = linkedDepartmentsQuery.data?.find(
    item => item.departmentName === department
  );

  const save = () => {
    updateProfileMutation.mutate({
      facilityId: facility?.facilityId,
      facilityName: facility?.facilityName,
      facilityRegion: facility?.county ?? undefined,
      facilityCountry: facility?.country ?? undefined,
      department: department.trim() || undefined,
    });
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/10">
      <CardHeader>
        <CardTitle>Primary care-delivery context</CardTitle>
        <CardDescription>
          Select the facility where you usually deliver care and the department
          context you want the platform to use. This does not create employment,
          institution membership, IERS access, or a dated duty.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <FacilityPicker
          value={facility}
          onChange={setFacility}
          showProfileHint={false}
        />

        <div className="space-y-3">
          {linkedDepartmentsQuery.data &&
          linkedDepartmentsQuery.data.length > 0 ? (
            <div className="space-y-2 rounded-lg border border-blue-200 bg-background p-3 dark:border-blue-900/50">
              <Label>Institution canonical department</Label>
              <Select
                value={
                  selectedLinkedDepartment
                    ? String(selectedLinkedDepartment.id)
                    : "none"
                }
                onValueChange={value => {
                  const selected = linkedDepartmentsQuery.data?.find(
                    item => item.id === Number(value)
                  );
                  setDepartment(selected?.departmentName ?? "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your institution department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    Choose from shared catalog below
                  </SelectItem>
                  {linkedDepartmentsQuery.data.map(item => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.departmentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Use the canonical department when your institution has supplied
                one. IERS assignment still requires separate authorization and
                acceptance.
              </p>
            </div>
          ) : null}

          {!selectedLinkedDepartment ? (
            <div className="space-y-2">
              <Label>Department context</Label>
              <DepartmentSelectors
                value={department}
                onChange={setDepartment}
              />
            </div>
          ) : null}
        </div>

        <Button
          type="button"
          onClick={save}
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending
            ? "Saving…"
            : "Save workplace context"}
        </Button>
      </CardContent>
    </Card>
  );
}
