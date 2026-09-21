import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ProviderProfileFormProps {
  onComplete?: () => void;
  experienceOverride?: number | null;
}

export const ProviderProfileForm: React.FC<ProviderProfileFormProps> = ({ onComplete, experienceOverride = null }) => {
  const [formData, setFormData] = useState({
    specialization: "",
    yearsOfExperience: 0,
    bio: "",
    certifications: [] as string[],
    languages: ["English"] as string[],
  });

  const [newLanguage, setNewLanguage] = useState("");
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const getProfileMutation = trpc.provider.getProfile.useQuery();
  const updateProfileMutation = trpc.provider.updateProfile.useMutation();

  // Load existing profile
  useEffect(() => {
    if (getProfileMutation.data) {
      const profile = getProfileMutation.data;
      setFormData({
        specialization: profile.specialization || "",
        yearsOfExperience: profile.yearsOfExperience || 0,
        bio: profile.bio || "",
        certifications: profile.certifications ? JSON.parse(profile.certifications) : [],
        languages: profile.languages ? JSON.parse(profile.languages) : ["English"],
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
          <CardTitle>Professional profile</CardTitle>
          <CardDescription>
            Manage your specialization, years of experience, optional language context, and professional biography here. Cadre is captured in Professional Identity. Regulatory licensing and AHA evidence belong in Professional Credentials, where you enter one Licence number with its jurisdiction and verification evidence. Primary care-delivery context is managed in Workplaces &amp; access.
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

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about your experience and passion for pediatric emergency care..."
                rows={4}
              />
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
