import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Course, calculateCoursePrice, calculateTotalCost, getDiscountPercentage } from "@/lib/courseData";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Link } from "wouter";

interface CourseCalculatorProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
}

export default function CourseCalculator({ course, isOpen, onClose }: CourseCalculatorProps) {
  const [staffCount, setStaffCount] = useState(50);
  const { trackPricingCalculatorUsed } = useAnalytics("CourseCalculator");

  const pricePerPerson = calculateCoursePrice(course.id, staffCount) || 0;
  const totalCost = calculateTotalCost(course.id, staffCount) || 0;
  const discountPercent = getDiscountPercentage(staffCount);

  const handleStaffCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = Number(e.target.value);
    setStaffCount(newCount);
    trackPricingCalculatorUsed(newCount, totalCost);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 sticky top-0 bg-white border-b">
          <div>
            <CardTitle className="text-2xl">{course.name}</CardTitle>
            <CardDescription>{course.longDescription}</CardDescription>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Course Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Course Details</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium ml-2">{course.duration}</span>
                </p>
                <p>
                  <span className="text-gray-600">Base Price:</span>
                  <span className="font-medium ml-2">{course.basePrice.toLocaleString()} KES</span>
                </p>
                <p>
                  <span className="text-gray-600">Target Audience:</span>
                  <span className="font-medium ml-2">{course.targetAudience}</span>
                </p>
                {course.prerequisites && (
                  <p>
                    <span className="text-gray-600">Prerequisites:</span>
                    <span className="font-medium ml-2">{course.prerequisites}</span>
                  </p>
                )}
                {course.certification && (
                  <p>
                    <span className="text-gray-600">Certification:</span>
                    <span className="font-medium ml-2">{course.certification}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Topics Covered</h3>
              <div className="flex flex-wrap gap-2">
                {course.topics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Calculator */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Calculate Your Cost</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Number of Staff: <span className="text-blue-600">{staffCount}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="500"
                  step="1"
                  value={staffCount}
                  onChange={handleStaffCountChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 staff</span>
                  <span>500+ staff</span>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <div className="text-xs text-gray-600 bg-white p-3 rounded border border-blue-200">
                  <p className="font-semibold mb-2">Bulk Discount Tiers:</p>
                  <div className="space-y-1 text-xs">
                    <p>1-20 staff: No discount → {course.basePrice.toLocaleString()} KES</p>
                    <p>21-50 staff: 10% discount → {Math.round(course.basePrice * 0.9).toLocaleString()} KES</p>
                    <p>51-100 staff: 20% discount → {Math.round(course.basePrice * 0.8).toLocaleString()} KES</p>
                    <p>101-200 staff: 30% discount → {Math.round(course.basePrice * 0.7).toLocaleString()} KES</p>
                    <p>200+ staff: 40% discount → {Math.round(course.basePrice * 0.6).toLocaleString()} KES</p>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Discount:</span>
                    <span className="font-semibold text-green-600">{discountPercent}% off</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per person:</span>
                    <span className="font-bold text-lg">{pricePerPerson.toLocaleString()} KES</span>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded border-2 border-green-200">
                    <span className="font-semibold text-gray-900">Total Cost:</span>
                    <span className="font-bold text-xl text-green-900">{totalCost.toLocaleString()} KES</span>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3 pt-4">
                <WhatsAppButton
                  phoneNumber="254706781260"
                  message={`Hello Paeds Resus, I am interested in the ${course.name} for ${staffCount} staff members. Total cost would be ${totalCost.toLocaleString()} KES.`}
                  size="lg"
                  className="flex-1"
                  label="Get Quote on WhatsApp"
                />
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="flex-1">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
