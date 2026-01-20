import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";

export default function TrainingSchedules() {
  const schedules = [
    {
      id: 1,
      title: "Elite Fellowship - Cohort 1",
      location: "Nairobi, Kenya",
      startDate: "February 3, 2026",
      endDate: "May 3, 2026",
      duration: "3 months",
      capacity: 30,
      enrolled: 24,
      level: "Advanced",
      format: "Hybrid (Online + In-person)",
      price: "KES 70,000",
      status: "Filling Fast",
    },
    {
      id: 2,
      title: "Standard Certification - Cohort 5",
      location: "Mombasa, Kenya",
      startDate: "February 10, 2026",
      endDate: "March 24, 2026",
      duration: "6 weeks",
      capacity: 25,
      enrolled: 18,
      level: "Intermediate",
      format: "In-person",
      price: "KES 20,000",
      status: "Available",
    },
    {
      id: 3,
      title: "Pediatric Trauma Module",
      location: "Dar es Salaam, Tanzania",
      startDate: "February 17, 2026",
      endDate: "March 3, 2026",
      duration: "2 weeks",
      capacity: 20,
      enrolled: 12,
      level: "Intermediate",
      format: "In-person",
      price: "KES 10,000",
      status: "Available",
    },
    {
      id: 4,
      title: "Neonatal Resuscitation",
      location: "Nairobi, Kenya",
      startDate: "March 1, 2026",
      endDate: "March 15, 2026",
      duration: "2 weeks",
      capacity: 15,
      enrolled: 14,
      level: "Intermediate",
      format: "In-person",
      price: "KES 15,000",
      status: "Almost Full",
    },
    {
      id: 5,
      title: "Elite Fellowship - Cohort 2",
      location: "Kampala, Uganda",
      startDate: "March 10, 2026",
      endDate: "June 10, 2026",
      duration: "3 months",
      capacity: 25,
      enrolled: 8,
      level: "Advanced",
      format: "Hybrid",
      price: "KES 70,000",
      status: "Available",
    },
    {
      id: 6,
      title: "Advanced Airway Management",
      location: "Online",
      startDate: "February 24, 2026",
      endDate: "March 10, 2026",
      duration: "2 weeks",
      capacity: 50,
      enrolled: 35,
      level: "Advanced",
      format: "Online",
      price: "KES 10,000",
      status: "Available",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Filling Fast":
        return "bg-orange-100 text-orange-800";
      case "Almost Full":
        return "bg-red-100 text-red-800";
      case "Available":
        return "bg-green-100 text-green-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getCapacityPercentage = (enrolled: number, capacity: number) => {
    return Math.round((enrolled / capacity) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Upcoming Programs
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Training Schedules
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find the perfect training program for your schedule and location
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white border-b">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>All Locations</option>
                <option>Nairobi</option>
                <option>Mombasa</option>
                <option>Dar es Salaam</option>
                <option>Kampala</option>
                <option>Online</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>All Levels</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>All Formats</option>
                <option>Online</option>
                <option>In-person</option>
                <option>Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>All Prices</option>
                <option>Under 20,000 KES</option>
                <option>50,000 - 100,000 KES</option>
                <option>Above 100,000 KES</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Training Programs */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-6">
            {schedules.map((schedule) => {
              const capacityPercentage = getCapacityPercentage(schedule.enrolled, schedule.capacity);
              return (
                <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Left Column - Program Info */}
                      <div className="md:col-span-2">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {schedule.title}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                              <Badge variant="secondary">{schedule.level}</Badge>
                              <Badge variant="outline">{schedule.format}</Badge>
                              <Badge className={getStatusColor(schedule.status)}>
                                {schedule.status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-3 text-gray-700">
                            <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-600">Start Date</p>
                              <p className="font-semibold">{schedule.startDate}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-gray-700">
                            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-600">Duration</p>
                              <p className="font-semibold">{schedule.duration}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-gray-700">
                            <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-600">Location</p>
                              <p className="font-semibold">{schedule.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-gray-700">
                            <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-600">Capacity</p>
                              <p className="font-semibold">
                                {schedule.enrolled}/{schedule.capacity} enrolled
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Capacity Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              capacityPercentage > 80
                                ? "bg-red-600"
                                : capacityPercentage > 60
                                  ? "bg-orange-600"
                                  : "bg-green-600"
                            }`}
                            style={{ width: `${capacityPercentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600">{capacityPercentage}% full</p>
                      </div>

                      {/* Right Column - CTA */}
                      <div className="flex flex-col justify-between">
                        <div>
                          <p className="text-3xl font-bold text-blue-600 mb-2">
                            {schedule.price}
                          </p>
                          <p className="text-sm text-gray-600 mb-4">
                            {schedule.duration} program
                          </p>
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Enroll Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Calendar View CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Want to See More?</h2>
          <p className="text-xl text-gray-600 mb-8">
            View our full calendar or subscribe to get notified about new programs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">View Full Calendar</Button>
            <Button size="lg" variant="outline">
              Subscribe to Updates
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
