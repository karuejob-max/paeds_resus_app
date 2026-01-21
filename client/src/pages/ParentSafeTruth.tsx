import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, TrendingUp } from "lucide-react";
import ParentSafeTruthForm from "@/components/ParentSafeTruthForm";

export default function ParentSafeTruth() {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f9] to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#2d5f5f] to-[#1a3a3a] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Your Child's Healthcare Journey</h1>
          </div>
          <p className="text-lg text-blue-100 max-w-2xl mb-6">
            Share your experience and help us understand how to better support families during pediatric emergencies. Your voice matters.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Shield className="w-3 h-3 mr-1" /> Confidential
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <TrendingUp className="w-3 h-3 mr-1" /> Your Voice Matters
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Heart className="w-3 h-3 mr-1" /> Family-Centered
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Why Share Your Story */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                Your Experience Matters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                As a parent or caregiver, you have unique insights into your child's emergency care experience. Your observations help us identify gaps and improve care for other families.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Completely Confidential
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                You can share your story anonymously. Your privacy is protected, and your feedback is used only to improve systems, never to blame individuals.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Share Your Story?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Your feedback helps us understand what worked well and what could be improved in your child's care journey.
          </p>
          <Button size="lg" className="bg-red-600 hover:bg-red-700" onClick={scrollToForm}>
            Share Your Story
          </Button>
        </div>

        {/* Form */}
        <div className="mb-12" ref={formRef}>
          <ParentSafeTruthForm />
        </div>
      </div>
    </div>
  );
}
