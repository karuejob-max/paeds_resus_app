import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingDown, Gift, Zap } from "lucide-react";

export default function PricingCalculator() {
  const [staffCount, setStaffCount] = useState(50);
  const [selectedProgram, setSelectedProgram] = useState("elite");
  const [duration, setDuration] = useState("3");

  const programs = {
    elite: {
      name: "Elite Fellowship",
      basePrice: 45000,
      duration: "3 months",
      features: ["Advanced training", "Mentorship", "Certification"],
    },
    standard: {
      name: "Standard Certification",
      basePrice: 25000,
      duration: "6 weeks",
      features: ["Core training", "Certification", "Support"],
    },
    module: {
      name: "Specialized Module",
      basePrice: 15000,
      duration: "2 weeks",
      features: ["Focused training", "Certificate"],
    },
  };

  const bulkDiscounts = [
    { min: 1, max: 10, discount: 0 },
    { min: 11, max: 25, discount: 10 },
    { min: 26, max: 50, discount: 15 },
    { min: 51, max: 100, discount: 20 },
    { min: 101, max: Infinity, discount: 25 },
  ];

  const getDiscount = (count: number) => {
    return bulkDiscounts.find((d) => count >= d.min && count <= d.max)?.discount || 0;
  };

  const currentProgram = programs[selectedProgram as keyof typeof programs];
  const discountPercentage = getDiscount(staffCount);
  const unitPrice = currentProgram.basePrice;
  const discountAmount = (unitPrice * discountPercentage) / 100;
  const pricePerPerson = unitPrice - discountAmount;
  const totalPrice = pricePerPerson * staffCount;
  const totalSavings = discountAmount * staffCount;

  const additionalServices = [
    {
      name: "Custom Training",
      price: 50000,
      description: "Tailored training program for your institution",
    },
    {
      name: "On-site Training",
      price: 100000,
      description: "Trainers visit your facility",
    },
    {
      name: "Ongoing Support",
      price: 10000,
      description: "Per month ongoing support and updates",
    },
    {
      name: "Advanced Analytics",
      price: 5000,
      description: "Detailed performance analytics and reporting",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Pricing Tool
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Pricing Calculator
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Calculate custom pricing for your institution with bulk discounts
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="md:col-span-2 space-y-8">
            {/* Program Selection */}
            <Card>
              <CardHeader>
                <CardTitle>1. Select Program</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {Object.entries(programs).map(([key, program]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedProgram(key)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        selectedProgram === key
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {program.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {program.duration}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {program.features.map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            {program.basePrice.toLocaleString()} KES
                          </p>
                          <p className="text-xs text-gray-500">per person</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Staff Count */}
            <Card>
              <CardHeader>
                <CardTitle>2. Number of Staff</CardTitle>
                <CardDescription>
                  Adjust the slider to see bulk discount pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-lg font-semibold text-gray-900">
                      {staffCount} staff members
                    </label>
                    <Badge className="bg-blue-100 text-blue-800">
                      {discountPercentage}% discount
                    </Badge>
                  </div>
                  <Slider
                    value={[staffCount]}
                    onValueChange={(value) => setStaffCount(value[0])}
                    min={1}
                    max={200}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Discount Tiers */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Bulk Discount Tiers</h4>
                  <div className="space-y-2">
                    {bulkDiscounts.map((tier, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between p-2 rounded ${
                          staffCount >= tier.min && staffCount <= tier.max
                            ? "bg-blue-100 border-l-4 border-blue-600"
                            : "text-gray-500"
                        }`}
                      >
                        <span className="text-sm">
                          {tier.min}-{tier.max === Infinity ? "+" : tier.max} staff
                        </span>
                        <span className="font-semibold">{tier.discount}% off</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Services */}
            <Card>
              <CardHeader>
                <CardTitle>3. Additional Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {additionalServices.map((service) => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-600">{service.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          +{service.price.toLocaleString()} KES
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Section */}
          <div className="md:col-span-1">
            <Card className="sticky top-4 border-2 border-blue-600 bg-blue-50">
              <CardHeader>
                <CardTitle>Price Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Price</span>
                    <span className="font-semibold text-gray-900">
                      {(unitPrice * staffCount).toLocaleString()} KES
                    </span>
                  </div>
                  {discountPercentage > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        Bulk Discount ({discountPercentage}%)
                      </span>
                      <span className="font-semibold">
                        -{totalSavings.toLocaleString()} KES
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900">Total Cost</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {totalPrice.toLocaleString()} KES
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">Cost per person</p>
                    <p className="text-xl font-bold text-blue-600">
                      {pricePerPerson.toLocaleString()} KES
                    </p>
                  </div>
                </div>

                {/* Benefits */}
                {discountPercentage > 0 && (
                  <div className="bg-white p-4 rounded border border-green-200">
                    <div className="flex items-start gap-2 mb-2">
                      <Gift className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-900 text-sm">
                          You Save
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {totalSavings.toLocaleString()} KES
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6">
                  Get Custom Quote
                </Button>

                {/* Info */}
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-xs text-gray-600">
                    <Zap className="w-4 h-4 inline mr-1" />
                    Prices are in KES and exclude taxes. Contact us for payment terms.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Pricing FAQs</h2>
          <div className="space-y-4">
            {[
              {
                q: "Can I customize the training for my institution?",
                a: "Yes, we offer fully customized training programs. Contact us for a custom quote.",
              },
              {
                q: "Do you offer payment plans?",
                a: "Yes, we can arrange flexible payment plans for bulk enrollments.",
              },
              {
                q: "Are there any hidden fees?",
                a: "No, the price shown includes everything. Taxes may apply based on your location.",
              },
              {
                q: "What if I need more staff trained later?",
                a: "You can add more staff at any time with the same bulk discount rate.",
              },
            ].map((faq, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
