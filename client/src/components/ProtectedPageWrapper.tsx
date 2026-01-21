import { ReactNode } from "react";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedPageWrapperProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  pageTitle?: string;
}

/**
 * Wrapper component that enforces role-based page access
 * If user's role is not in allowedRoles, shows access denied message
 */
export default function ProtectedPageWrapper({
  children,
  allowedRoles,
  pageTitle = "This Page",
}: ProtectedPageWrapperProps) {
  const { role, isLoading } = useUserRole();
  const [, navigate] = useLocation();

  // Show loading state while role is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a4d4d] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user's role is allowed
  const isAllowed = role && allowedRoles.includes(role);

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-2 border-orange-200">
          <CardContent className="pt-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
              <p className="text-gray-600 mb-6">
                {pageTitle} is only available for specific user roles. Your current role ({role || "none"}) doesn't have access to this content.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-blue-900 font-semibold mb-2">💡 To access this page:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Change your role using the "Select Role" dropdown in the header</li>
                  <li>• Select one of the allowed roles for this page</li>
                  <li>• Your content will update automatically</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/")}
                  className="w-full bg-[#1a4d4d] hover:bg-[#0d3333] text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go to Home
                </Button>
                <Button
                  onClick={() => navigate("/resources")}
                  variant="outline"
                  className="w-full border-[#1a4d4d] text-[#1a4d4d]"
                >
                  View Resources
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access, render the page
  return <>{children}</>;
}
