import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, Users, Building2, X } from "lucide-react";

interface RoleSelectionPromptProps {
  onRoleSelected: (role: "parent" | "provider" | "institution") => void;
  onClose?: () => void;
}

export default function RoleSelectionPrompt({ onRoleSelected, onClose }: RoleSelectionPromptProps) {
  const [selectedRole, setSelectedRole] = useState<"parent" | "provider" | "institution" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = async (role: "parent" | "provider" | "institution") => {
    setIsLoading(true);
    try {
      localStorage.setItem("userRole", role);
      setSelectedRole(role);
      
      const routeMap: Record<string, string> = {
        parent: "/parent-hub",
        provider: "/providers",
        institution: "/institutional",
      };
      
      setTimeout(() => {
        onRoleSelected(role);
        window.location.href = routeMap[role];
      }, 500);
    } catch (error) {
      console.error("Error updating role:", error);
      setIsLoading(false);
    }
  };

  const roles = [
    {
      id: "parent",
      label: "Parent / Caregiver",
      description: "Access resources for parents and caregivers, including child health tips and emergency guidance",
      icon: Users,
      color: "from-green-500 to-emerald-600",
      textColor: "text-green-600",
    },
    {
      id: "provider",
      label: "Healthcare Provider",
      description: "Access clinical protocols, Safe-Truth reporting, and professional development resources",
      icon: Stethoscope,
      color: "from-blue-500 to-indigo-600",
      textColor: "text-blue-600",
    },
    {
      id: "institution",
      label: "Institution / Hospital",
      description: "Manage institutional accounts, provider access, and institutional analytics",
      icon: Building2,
      color: "from-purple-500 to-pink-600",
      textColor: "text-purple-600",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Welcome to Paeds Resus</CardTitle>
              <CardDescription className="mt-2">
                Help us personalize your experience. What best describes you?
              </CardDescription>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;

              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id as any)}
                  disabled={isLoading}
                  className={`relative p-6 rounded-lg border-2 transition-all duration-300 text-left ${
                    isSelected
                      ? "border-[#ff6633] bg-orange-50"
                      : "border-gray-200 hover:border-[#ff6633] hover:bg-gray-50"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2">{role.label}</h3>

                  <p className="text-sm text-gray-600 mb-4">{role.description}</p>

                  {isSelected && (
                    <div className="flex items-center gap-2 text-[#ff6633] font-medium text-sm">
                      <div className="w-5 h-5 rounded-full bg-[#ff6633] flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                      Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              💡 <strong>Tip:</strong> You can change this preference anytime in your account settings or by using the toggle on the Resources page.
            </p>
          </div>

          {selectedRole && (
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleRoleSelect(selectedRole)}
                disabled={isLoading}
                className="bg-[#ff6633] hover:bg-[#e55a22]"
              >
                {isLoading ? "Confirming..." : "Confirm & Continue"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
