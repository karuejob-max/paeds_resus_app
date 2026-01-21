import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Award, TrendingUp, Users, Filter, X } from "lucide-react";
import { Link } from "wouter";

interface Facility {
  id: number;
  name: string;
  county: string;
  pCOSCARate: number;
  badge: "Gold" | "Silver" | "Bronze" | "None";
  specialties: string[];
  staffEngagementScore: number;
  totalEventsReported: number;
  phone: string;
  email: string;
}

// Mock facility data - in production, fetch from API
const mockFacilities: Facility[] = [
  {
    id: 1,
    name: "Kenyatta National Hospital",
    county: "Nairobi",
    pCOSCARate: 87.5,
    badge: "Gold",
    specialties: ["Pediatric ICU", "Emergency Medicine", "Trauma Care"],
    staffEngagementScore: 89,
    totalEventsReported: 156,
    phone: "+254 20 2726300",
    email: "info@knh.or.ke",
  },
  {
    id: 2,
    name: "Aga Khan University Hospital",
    county: "Nairobi",
    pCOSCARate: 82.3,
    badge: "Silver",
    specialties: ["Pediatric Surgery", "Neonatal Care", "Emergency Medicine"],
    staffEngagementScore: 85,
    totalEventsReported: 98,
    phone: "+254 20 3662000",
    email: "info@akuh.ac.ke",
  },
  {
    id: 3,
    name: "Mombasa Hospital",
    county: "Mombasa",
    pCOSCARate: 75.8,
    badge: "Bronze",
    specialties: ["Emergency Medicine", "Pediatric Care"],
    staffEngagementScore: 72,
    totalEventsReported: 45,
    phone: "+254 41 2222000",
    email: "info@mombasahospital.ke",
  },
  {
    id: 4,
    name: "Kisumu Teaching and Referral Hospital",
    county: "Kisumu",
    pCOSCARate: 78.5,
    badge: "Bronze",
    specialties: ["Emergency Medicine", "Pediatric Care", "Trauma"],
    staffEngagementScore: 76,
    totalEventsReported: 62,
    phone: "+254 57 2030000",
    email: "info@kisumuhospital.ke",
  },
  {
    id: 5,
    name: "Nakuru War Memorial Hospital",
    county: "Nakuru",
    pCOSCARate: 81.2,
    badge: "Silver",
    specialties: ["Emergency Medicine", "Pediatric Care"],
    staffEngagementScore: 80,
    totalEventsReported: 78,
    phone: "+254 51 2212000",
    email: "info@nakuruhospital.ke",
  },
  {
    id: 6,
    name: "Eldoret Referral Hospital",
    county: "Uasin Gishu",
    pCOSCARate: 76.9,
    badge: "Bronze",
    specialties: ["Emergency Medicine", "Pediatric Care"],
    staffEngagementScore: 74,
    totalEventsReported: 52,
    phone: "+254 53 2031000",
    email: "info@eldorethospital.ke",
  },
];
const counties = ["All Counties", ...Array.from(new Set(mockFacilities.map((f) => f.county)))];
const badges = ["All Badges", "Gold", "Silver", "Bronze"];

export function FacilityDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [selectedBadge, setSelectedBadge] = useState("All Badges");
  const [showFilters, setShowFilters] = useState(false);

  const filteredFacilities = useMemo(() => {
    return mockFacilities.filter((facility) => {
      const matchesSearch =
        facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.specialties.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCounty = selectedCounty === "All Counties" || facility.county === selectedCounty;
      const matchesBadge = selectedBadge === "All Badges" || facility.badge === selectedBadge;

      return matchesSearch && matchesCounty && matchesBadge;
    });
  }, [searchTerm, selectedCounty, selectedBadge]);

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
          <h1 className="text-4xl font-bold mb-4">Accredited Facilities Directory</h1>
          <p className="text-blue-100 text-lg">
            Find hospitals and healthcare facilities accredited by Paeds Resus for excellence in pediatric emergency care.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by facility name, county, or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3 text-lg"
            />
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <p className="text-gray-600">
            Showing <span className="font-bold text-gray-900">{filteredFacilities.length}</span> facilities
          </p>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="p-6 mb-8 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* County Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">County</label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {counties.map((county) => (
                    <label key={county} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="county"
                        value={county}
                        checked={selectedCounty === county}
                        onChange={(e) => setSelectedCounty(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700">{county}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Badge Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Accreditation Badge</label>
                <div className="space-y-2">
                  {badges.map((badge) => (
                    <label key={badge} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="badge"
                        value={badge}
                        checked={selectedBadge === badge}
                        onChange={(e) => setSelectedBadge(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700">{badge}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchTerm || selectedCounty !== "All Counties" || selectedBadge !== "All Badges") && (
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCounty("All Counties");
                  setSelectedBadge("All Badges");
                }}
                variant="outline"
                size="sm"
                className="mt-4 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </Button>
            )}
          </Card>
        )}

        {/* Facilities Grid */}
        {filteredFacilities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFacilities.map((facility) => (
              <Link key={facility.id} href={`/facility/${facility.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="p-6">
                    {/* Header with Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{facility.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {facility.county}
                        </p>
                      </div>
                      {facility.badge !== "None" && (
                        <div className={`px-2 py-1 rounded text-xs font-bold border ${badgeColors[facility.badge]}`}>
                          {badgeIcons[facility.badge]} {facility.badge}
                        </div>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          pCOSCA Rate
                        </span>
                        <span className="font-bold text-green-600">{facility.pCOSCARate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Engagement
                        </span>
                        <span className="font-bold text-blue-600">{facility.staffEngagementScore}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          Events Reported
                        </span>
                        <span className="font-bold text-purple-600">{facility.totalEventsReported}</span>
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Specialties</p>
                      <div className="flex flex-wrap gap-1">
                        {facility.specialties.slice(0, 2).map((specialty, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {specialty}
                          </span>
                        ))}
                        {facility.specialties.length > 2 && (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            +{facility.specialties.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      View Details
                    </Button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-lg text-gray-600 mb-4">No facilities found matching your criteria.</p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedCounty("All Counties");
                setSelectedBadge("All Badges");
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
