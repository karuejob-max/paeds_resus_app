import { useState, useRef } from "react";
import { MapPin, Search, Phone, MapIcon, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapView } from "@/components/Map";

interface Facility {
  id: number;
  name: string;
  type: "hospital" | "clinic" | "training_center";
  address: string;
  phone: string;
  email: string;
  lat: number;
  lng: number;
  programs: string[];
  rating: number;
  reviews: number;
  hours: string;
  website?: string;
}

export default function FacilityLocator() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [facilityType, setFacilityType] = useState<string>("all");
  // Map reference for future use

  // Mock facility data
  const mockFacilities: Facility[] = [
    {
      id: 1,
      name: "Kenyatta National Hospital",
      type: "hospital",
      address: "Kenyatta Avenue, Nairobi",
      phone: "+254 20 2726300",
      email: "info@knh.go.ke",
      lat: -1.2921,
      lng: 36.7539,
      programs: ["BLS", "ACLS", "PALS", "Fellowship"],
      rating: 4.8,
      reviews: 234,
      hours: "Mon-Fri: 8am-5pm",
      website: "www.knh.go.ke",
    },
    {
      id: 2,
      name: "Aga Khan University Hospital",
      type: "hospital",
      address: "Voi Road, Nairobi",
      phone: "+254 20 3662000",
      email: "info@aku.ac.ke",
      lat: -1.3149,
      lng: 36.8045,
      programs: ["BLS", "ACLS", "PALS"],
      rating: 4.9,
      reviews: 189,
      hours: "Mon-Fri: 8am-6pm",
      website: "www.aku.ac.ke",
    },
    {
      id: 3,
      name: "Nairobi Hospital",
      type: "hospital",
      address: "Argwings Kodhek Road, Nairobi",
      phone: "+254 20 2844000",
      email: "info@nairobihospital.co.ke",
      lat: -1.2855,
      lng: 36.8045,
      programs: ["BLS", "ACLS"],
      rating: 4.7,
      reviews: 156,
      hours: "Mon-Fri: 8am-5pm",
    },
    {
      id: 4,
      name: "Paeds Resus Training Center",
      type: "training_center",
      address: "Westlands, Nairobi",
      phone: "+254 712 345678",
      email: "training@paedsresus.com",
      lat: -1.2656,
      lng: 36.8045,
      programs: ["BLS", "ACLS", "PALS", "Fellowship"],
      rating: 4.9,
      reviews: 412,
      hours: "Mon-Sat: 8am-6pm",
      website: "www.paedsresus.com",
    },
  ];

  const filteredFacilities = mockFacilities.filter((facility) => {
    const matchesSearch =
      facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = facilityType === "all" || facility.type === facilityType;
    return matchesSearch && matchesType;
  });

  const handleFacilitySelect = (facility: Facility) => {
    setSelectedFacility(facility);
    // Map will be centered on selected facility
  };

  const getFacilityTypeLabel = (type: string) => {
    switch (type) {
      case "hospital":
        return "Hospital";
      case "clinic":
        return "Clinic";
      case "training_center":
        return "Training Center";
      default:
        return type;
    }
  };

  const getFacilityTypeColor = (type: string) => {
    switch (type) {
      case "hospital":
        return "bg-red-100 text-red-800";
      case "clinic":
        return "bg-blue-100 text-blue-800";
      case "training_center":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MapIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Find Training Facilities</h1>
          </div>
          <p className="text-gray-600">
            Locate Paeds Resus training centers and partner hospitals near you
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by facility name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <select
                value={facilityType}
                onChange={(e) => setFacilityType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="hospital">Hospitals</option>
                <option value="clinic">Clinics</option>
                <option value="training_center">Training Centers</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Facilities List */}
          <div className="lg:col-span-1">
            <Card className="p-4 h-[600px] overflow-y-auto">
              <h2 className="font-semibold text-gray-900 mb-4">
                Found {filteredFacilities.length} Facilities
              </h2>

              <div className="space-y-3">
                {filteredFacilities.map((facility) => (
                  <div
                    key={facility.id}
                    onClick={() => handleFacilitySelect(facility)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedFacility?.id === facility.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {facility.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getFacilityTypeColor(
                          facility.type
                        )}`}
                      >
                        {getFacilityTypeLabel(facility.type)}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {facility.address}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {facility.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {facility.hours}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-semibold text-gray-900">
                        {facility.rating}
                      </span>
                      <span className="text-xs text-gray-600">
                        ({facility.reviews} reviews)
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {facility.programs.map((program) => (
                        <span
                          key={program}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                        >
                          {program}
                        </span>
                      ))}
                    </div>

                    <Button size="sm" className="w-full text-xs">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="p-4 h-[600px]">
              <MapView
                onMapReady={(map: any) => {
                  // Map is ready
                  console.log("Map initialized");
                }}
              />
            </Card>
          </div>
        </div>

        {/* Selected Facility Details */}
        {selectedFacility && (
          <Card className="mt-6 p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedFacility.name}
                </h2>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold text-gray-900">
                      {selectedFacility.rating}
                    </span>
                  </div>
                  <span className="text-gray-600">
                    ({selectedFacility.reviews} reviews)
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Address</p>
                    <p className="font-medium text-gray-900">
                      {selectedFacility.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <p className="font-medium text-gray-900">
                      {selectedFacility.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-medium text-gray-900">
                      {selectedFacility.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Hours</p>
                    <p className="font-medium text-gray-900">
                      {selectedFacility.hours}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Available Programs
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {selectedFacility.programs.map((program) => (
                    <Card key={program} className="p-3 bg-blue-50 border-blue-200">
                      <p className="font-medium text-blue-900">{program}</p>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    Enroll Now
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Get Directions
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Info Section */}
        <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">About Our Facilities</h3>
          <p className="text-sm text-blue-800">
            All Paeds Resus partner facilities are verified and accredited to deliver
            high-quality pediatric resuscitation training. Each facility is equipped with
            modern simulation equipment and experienced instructors certified in pediatric
            emergency care.
          </p>
        </Card>
      </div>
    </div>
  );
}
