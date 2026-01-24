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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ProviderProfileFormProps {
  onComplete?: () => void;
}

export const ProviderProfileForm: React.FC<ProviderProfileFormProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    licenseNumber: "",
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
  });

  const [newCertification, setNewCertification] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const getProfileMutation = trpc.provider.getProfile.useQuery();
  const updateProfileMutation = trpc.provider.updateProfile.useMutation();

  // Load existing profile
  useEffect(() => {
    if (getProfileMutation.data) {
      const profile = getProfileMutation.data;
      setFormData({
        licenseNumber: profile.licenseNumber || "",
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
      });
      setCompletionPercentage(profile.profileCompletionPercentage || 0);
    }
  }, [getProfileMutation.data]);

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

  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification],
      }));
      setNewCertification("");
    }
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
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
      const result = await updateProfileMutation.mutateAsync(formData);
      setCompletionPercentage(result.completionPercentage);
      if (result.completionPercentage >= 80 && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Help us understand your background and facility to provide better support
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
              <h3 className="font-semibold text-lg">Professional Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., KEN-2024-12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="e.g., Pediatrics, Emergency Medicine"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
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

              {/* Certifications */}
              <div className="space-y-2">
                <Label>Certifications</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    placeholder="Add certification (e.g., BLS, ACLS)"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCertification())}
                  />
                  <Button type="button" onClick={addCertification} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.certifications.map((cert, idx) => (
                    <div
                      key={idx}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {cert}
                      <button
                        type="button"
                        onClick={() => removeCertification(idx)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-2">
                <Label>Languages</Label>
                <div className="flex gap-2">
                  <Input
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Add language (e.g., Swahili, French)"
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

            {/* Facility Information Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Facility Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facilityName">Facility Name</Label>
                  <Input
                    id="facilityName"
                    name="facilityName"
                    value={formData.facilityName}
                    onChange={handleInputChange}
                    placeholder="e.g., Nairobi Central Hospital"
                  />
                </div>

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
            </div>

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
