import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, TrendingUp, Users, CheckCircle, AlertCircle, MapPin, Phone, Mail } from "lucide-react";

interface FacilityData {
  id: number;
  name: string;
  county: string;
  phone: string;
  email: string;
  website?: string;
  pCOSCARate: number;
  totalEventsReported: number;
  staffEngagementScore: number;
  overallScore: number;
  badge: "Bronze" | "Silver" | "Gold" | "None";
  accreditationStatus: "accredited" | "pending" | "ineligible";
  description: string;
  specialties: string[];
  certifications: string[];
  successStories: {
    title: string;
    description: string;
    date: string;
  }[];
}

const mockFacility: FacilityData = {
  id: 1,
  name: "Kenyatta National Hospital",
  county: "Nairobi",
  phone: "+254 20 2726300",
  email: "info@knh.or.ke",
  website: "www.knh.or.ke",
  pCOSCARate: 87.5,
  totalEventsReported: 156,
  staffEngagementScore: 89,
  overallScore: 88,
  badge: "Gold",
  accreditationStatus: "accredited",
  description:
    "Kenyatta National Hospital is Kenya's leading tertiary referral hospital with a commitment to pediatric emergency care excellence.",
  specialties: ["Pediatric ICU", "Emergency Medicine", "Trauma Care", "Neonatal Resuscitation"],
  certifications: ["ISO 9001:2015", "JCI Accredited", "Paeds Resus Gold Accredited"],
  successStories: [
    {
      title: "Reduced Pediatric Mortality by 35%",
      description:
        "After implementing Paeds Resus protocols, KNH achieved a 35% reduction in preventable pediatric deaths within 18 months.",
      date: "2024-06-15",
    },
    {
      title: "Improved Staff Competency",
      description:
        "100% of emergency staff completed Paeds Resus training, resulting in faster response times and better outcomes.",
      date: "2024-03-20",
    },
  ],
};

export function FacilityProfile() {
  const params = useParams();
  const facilityId = params.id || "1";
  const [facility, setFacility] = useState<FacilityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch facility data from API
    // For now, use mock data
    setTimeout(() => {
      setFacility(mockFacility);
      setLoading(false);
    }, 500);
  }, [facilityId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading facility profile...</p>
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Facility Not Found</h2>
          <p className="text-gray-600">The facility you're looking for doesn't exist or has been removed.</p>
        </Card>
      </div>
    );
  }

  const badgeColors = {
    Gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
    Silver: "bg-gray-100 text-gray-800 border-gray-300",
    Bronze: "bg-orange-100 text-orange-800 border-orange-300",
    None: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const badgeIcons = {
    Gold: "🥇",
    Silver: "🥈",
    Bronze: "🥉",
    None: "",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{facility.name}</h1>
              <p className="text-blue-100 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {facility.county}, Kenya
              </p>
            </div>
            {facility.badge !== "None" && (
              <div className={`px-4 py-2 rounded-lg border-2 ${badgeColors[facility.badge]}`}>
                <div className="text-2xl mb-1">{badgeIcons[facility.badge]}</div>
                <div className="font-bold">{facility.badge} Accredited</div>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              <a href={`tel:${facility.phone}`} className="hover:underline">
                {facility.phone}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              <a href={`mailto:${facility.email}`} className="hover:underline">
                {facility.email}
              </a>
            </div>
            {facility.website && (
              <div className="flex items-center gap-2">
                <a href={`https://${facility.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {facility.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">pCOSCA Rate</p>
                <p className="text-3xl font-bold text-green-600">{facility.pCOSCARate}%</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Events Reported</p>
                <p className="text-3xl font-bold text-blue-600">{facility.totalEventsReported}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Staff Engagement</p>
                <p className="text-3xl font-bold text-purple-600">{facility.staffEngagementScore}</p>
              </div>
              <Users className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Overall Score</p>
                <p className="text-3xl font-bold text-orange-600">{facility.overallScore}</p>
              </div>
              <Award className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Description */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">About {facility.name}</h2>
          <p className="text-gray-700 mb-6">{facility.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Specialties</h3>
              <ul className="space-y-2">
                {facility.specialties.map((specialty, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{specialty}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Certifications</h3>
              <ul className="space-y-2">
                {facility.certifications.map((cert, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">{cert}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Success Stories */}
        {facility.successStories.length > 0 && (
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Success Stories</h2>
            <div className="space-y-6">
              {facility.successStories.map((story, index) => (
                <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{story.title}</h3>
                  <p className="text-gray-700 mb-2">{story.description}</p>
                  <p className="text-sm text-gray-500">{new Date(story.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* CTA Section */}
        <Card className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-2xl font-bold mb-4">Interested in Accreditation?</h2>
          <p className="text-gray-700 mb-6">
            Learn how {facility.name} achieved their {facility.badge} accreditation and how your facility can too.
          </p>
          <div className="flex gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Request Consultation
            </Button>
            <Button variant="outline" className="border-blue-600 text-blue-600">
              View Accreditation Requirements
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
