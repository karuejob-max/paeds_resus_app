import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Building2, CheckCircle2, AlertCircle } from "lucide-react";
import { FacilityPicker, type FacilitySelection } from "./FacilityPicker";
import { DepartmentSelectors } from "./DepartmentSelectors";

interface ProviderProfileFormProps {
  onComplete?: () => void;
  showWorkplaceContext?: boolean;
  experienceOverride?: number | null;
}

export const ProviderProfileForm: React.FC<ProviderProfileFormProps> = ({ onComplete, showWorkplaceContext = false, experienceOverride = null }) => {
  const [formData, setFormData] = useState({
    specialization: "",
    yearsOfExperience: 0,
    facilityName: "",
    facilityType: "primary_health_center" as const,
    facilityRegion: "",
    facilityPhone: "",
    facilityEmail: "",
    averagePatientLoad: 0,
    bio: "",
    certifications: [] as string[],
    languages: ["English"] as string[],
    department: "",
  });

  const [newLanguage, setNewLanguage] = useState("");
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [facility, setFacility] = useState<FacilitySelection | null>(null);

  const getProfileMutation = trpc.provider.getProfile.useQuery();
  const linkedDepartmentsQuery = trpc.institution.getMyLinkedFacilityDepartments.useQuery();
  const updateProfileMutation = trpc.provider.updateProfile.useMutation();

  // Load existing profile
  useEffect(() => {
    if (getProfileMutation.data) {
      const profile = getProfileMutation.data;
      if (profile.facilityId && profile.facilityName) {
        setFacility({
          facilityId: profile.facilityId,
          facilityName: profile.facilityName,
          county: profile.facilityRegion ?? null,
          country: profile.facilityCountry ?? "Kenya",
        });
      }
      setFormData({
        specialization: profile.specialization || "",
        yearsOfExperience: profile.yearsOfExperience || 0,
        facilityName: profile.facilityName || "",
        facilityType: (profile.facilityType as any) || "primary_health_center",
        facilityRegion: profile.facilityRegion || "",
        facilityPhone: profile.facilityPhone || "",
        facilityEmail: profile.facilityEmail || "",
        averagePatientLoad: profile.averagePatientLoad || 0,
        bio: profile.bio || "",
        certifications: profile.certifications ? JSON.parse(profile.certifications) : [],
        languages: profile.languages ? JSON.parse(profile.languages) : ["English"],
        department: (profile as any).department || "",
      });
      setCompletionPercentage(profile.profileCompletionPercentage || 0);
    }
  }, [getProfileMutation.data]);

  useEffect(() => {
    if (experienceOverride === null || experienceOverride === undefined) return;
    setFormData(prev => ({ ...prev, yearsOfExperience: experienceOverride }));
  }, [experienceOverride]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage)) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage],
      }));
      setNewLanguage("");
    }
  };

  const removeLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== lang),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { facilityName, facilityType, facilityRegion, facilityPhone, facilityEmail, department, ...professionalData } = formData;
      const result = await updateProfileMutation.mutateAsync({
        ...professionalData,
        ...(showWorkplaceContext
          ? {
              facilityId: facility?.facilityId,
              facilityName,
              facilityType,
              facilityRegion,
              facilityPhone,
              facilityEmail,
              department,
            }
          : {}),
      });
      setCompletionPercentage(result.completionPercentage);
      if (result.completionPercentage >= 80 && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const selectedLinkedDepartment = linkedDepartmentsQuery.data?.find((department) => department.departmentName === formData.department);

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Professional profile</CardTitle>
          <CardDescription>
            Manage your years of experience, optional language context, and professional biography here. Cadre and specialization are captured once in Professional Identity. Regulatory licensing and AHA evidence belong in Professional Credentials, where you enter one Licence number with its jurisdiction and verification evidence. Primary care-delivery context is managed in Workplaces &amp; access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Completion Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Profile Completion</Label>
                <span className="text-sm font-semibold text-blue-600">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

                          {/* Professional Information Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Experience and language context</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">

                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                  {experienceOverride !== null && experienceOverride !== undefined ? (
                    <p className="text-xs text-muted-foreground">
                      Autofilled from the Licence Issue date. Review and adjust if your professional experience began earlier or later.
                    </p>
                  ) : null}
                  <Input
                    id="yearsOfExperience"
                    name="yearsOfExperience"
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={handleInputChange}
                    min="0"
                    max="60"
                  />
                </div>
              </div>

              {showWorkplaceContext ? <div className="space-y-3 border-t pt-4">
                {linkedDepartmentsQuery.data && linkedDepartmentsQuery.data.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/40 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
                    <Label>Institution canonical department</Label>
                    <Select
                      value={selectedLinkedDepartment ? String(selectedLinkedDepartment.id) : "none"}
                      onValueChange={(value) => {
                        const selected = linkedDepartmentsQuery.data?.find((department) => department.id === Number(value));
                        setFormData((current) => ({ ...current, department: selected?.departmentName ?? "" }));
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select your institution department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Choose from shared catalog below</SelectItem>
                        {linkedDepartmentsQuery.data.map((department) => <SelectItem key={department.id} value={String(department.id)}>{department.departmentName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Use this list when your facility has added a local department. It keeps your profile, CPD attendance, and IERS records on the same canonical identity.</p>
                  </div>
                )}
                {!selectedLinkedDepartment && <DepartmentSelectors
                  value={formData.department}
                  onChange={(val) => setFormData(prev => ({ ...prev, department: val }))}
                />}
              </div> : null}

              {/* AHA evidence is intentionally not collected here. It belongs in Professional Credentials. */}

              {/* Languages */}
              <div className="space-y-2">
                <Label>Languages (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Add another language if useful"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
                  />
                  <Button type="button" onClick={addLanguage} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.languages.map((lang) => (
                    <div
                      key={lang}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {lang}
                      {lang !== "English" && (
                        <button
                          type="button"
                          onClick={() => removeLanguage(lang)}
                          className="text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {showWorkplaceContext ? <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Facility Information</h3>
              {(getProfileMutation.data?.facilityHistory?.length ?? 0) > 0 && (
                <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/40 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-blue-950 dark:text-blue-100"><Building2 className="h-4 w-4" />CPD-linked facilities</p>
                    <p className="mt-1 text-xs leading-relaxed text-blue-900/80 dark:text-blue-100/80">These facilities are updated from hospitals where you have signed in for CPD. The editable facility below is your primary facility; every association remains visible for institutional reconciliation.</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {getProfileMutation.data?.facilityHistory?.map((entry) => (
                      <div key={entry.institutionId} className="rounded-md border bg-background p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 text-sm font-medium">{entry.institutionName}</p>
                          <Badge variant={entry.membershipStatus === "active" ? "default" : "secondary"} className="shrink-0 text-[10px]">{entry.membershipStatus ?? "CPD linked"}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{entry.relationship === "locum_outreach" ? "Outreach / locum association" : "Permanent facility association"}</p>
                        {entry.departments.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Department: {entry.departments.join(", ")}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FacilityPicker
                value={facility}
                onChange={setFacility}
                required
                showProfileHint={false}
              />

                <div className="space-y-2">
                  <Label htmlFor="facilityType">Facility Type</Label>
                  <Select value={formData.facilityType} onValueChange={(value) => handleSelectChange("facilityType", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary_health_center">Primary Health Center</SelectItem>
                      <SelectItem value="health_post">Health Post</SelectItem>
                      <SelectItem value="district_hospital">District Hospital</SelectItem>
                      <SelectItem value="private_clinic">Private Clinic</SelectItem>
                      <SelectItem value="ngo_clinic">NGO Clinic</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facilityRegion">Region</Label>
                  <Input
                    id="facilityRegion"
                    name="facilityRegion"
                    value={formData.facilityRegion}
                    onChange={handleInputChange}
                    placeholder="e.g., Nairobi, Kisumu"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="averagePatientLoad">Average Daily Patient Load</Label>
                  <Input
                    id="averagePatientLoad"
                    name="averagePatientLoad"
                    type="number"
                    value={formData.averagePatientLoad}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="e.g., 50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facilityPhone">Facility Phone</Label>
                  <Input
                    id="facilityPhone"
                    name="facilityPhone"
                    value={formData.facilityPhone}
                    onChange={handleInputChange}
                    placeholder="+254..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facilityEmail">Facility Email</Label>
                  <Input
                    id="facilityEmail"
                    name="facilityEmail"
                    type="email"
                    value={formData.facilityEmail}
                    onChange={handleInputChange}
                    placeholder="facility@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about your experience and passion for pediatric emergency care..."
                  rows={4}
                />
              </div>
            </div> : null}

            {/* Completion Status */}
            {completionPercentage >= 80 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">Profile is complete! You can start using the platform.</span>
              </div>
            )}

            {completionPercentage < 80 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  Complete at least {80 - completionPercentage}% more of your profile to unlock full access
                </span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="flex-1"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
