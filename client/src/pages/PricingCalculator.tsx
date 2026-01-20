import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { individualCourses, institutionalPricing, getInstitutionalPrice, formatPrice, fellowshipTiers } from "@/const/pricing";
import { Check, TrendingDown } from "lucide-react";

export default function PricingCalculator() {
  const [selectedCourse, setSelectedCourse] = useState("bls");
  const [numberOfSeats, setNumberOfSeats] = useState(10);
  const [activeTab, setActiveTab] = useState("individual");

  // Calculate institutional pricing
  const institutionalPrice = getInstitutionalPrice(selectedCourse, numberOfSeats);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pricing Calculator</h1>
          <p className="text-gray-600">
            Calculate training costs for individuals and institutions
          </p>
        </div>
      </section>

      {/* Pricing Tabs */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto mb-8 grid-cols-2">
              <TabsTrigger value="individual">Individual Pricing</TabsTrigger>
              <TabsTrigger value="institutional">Institutional Pricing</TabsTrigger>
            </TabsList>

            {/* Individual Pricing Tab */}
            <TabsContent value="individual">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Course Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select a Course</CardTitle>
                    <CardDescription>Choose the training program</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {individualCourses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => setSelectedCourse(course.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition ${
                          selectedCourse === course.id
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900">{course.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-500">{course.duration}</span>
                          <span className="text-lg font-bold text-blue-600">{formatPrice(course.price)}</span>
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                {/* Price Summary */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader>
                    <CardTitle>Price Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {individualCourses.find((c) => c.id === selectedCourse) && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Course</p>
                          <p className="text-xl font-bold text-gray-900">
                            {individualCourses.find((c) => c.id === selectedCourse)?.name}
                          </p>
                        </div>

                        <div className="border-t border-blue-200 pt-4">
                          <p className="text-sm text-gray-600 mb-2">Price per Person</p>
                          <p className="text-4xl font-bold text-blue-600">
                            {formatPrice(
                              individualCourses.find((c) => c.id === selectedCourse)?.price || 0
                            )}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-2">Level</p>
                          <p className="font-semibold text-gray-900">
                            {individualCourses.find((c) => c.id === selectedCourse)?.level}
                          </p>
                        </div>

                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Enroll Now
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Institutional Pricing Tab */}
            <TabsContent value="institutional">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Institutional Pricing</CardTitle>
                    <CardDescription>Calculate bulk training costs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Course Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Course
                      </label>
                      <div className="space-y-2">
                        {Object.entries(institutionalPricing).map(([key, course]) => (
                          <button
                            key={key}
                            onClick={() => setSelectedCourse(key)}
                            className={`w-full text-left p-3 rounded-lg border-2 transition ${
                              selectedCourse === key
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <p className="font-medium text-gray-900">{course.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Base: {formatPrice(course.basePricePerSeat)}/seat
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Number of Seats */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Learners
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={numberOfSeats}
                        onChange={(e) => setNumberOfSeats(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Minimum: {institutionalPricing[selectedCourse as keyof typeof institutionalPricing]?.minimumSeats || 5} learners
                      </p>
                    </div>

                    {/* Bulk Discounts Info */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-blue-600" />
                        Available Discounts
                      </h4>
                      <div className="space-y-2">
                        {institutionalPricing[selectedCourse as keyof typeof institutionalPricing]?.bulkDiscounts.map((tier) => (
                          <div key={tier.seats} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{tier.seats}+ learners</span>
                            <span className="font-semibold text-blue-600">{tier.discount}% off</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Price Summary */}
                {institutionalPrice && (
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader>
                      <CardTitle>Cost Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Price per Learner</p>
                        <p className="text-3xl font-bold text-green-600">
                          {formatPrice(institutionalPrice.pricePerSeat)}
                        </p>
                        {institutionalPrice.discountPercentage > 0 && (
                          <p className="text-sm text-green-700 mt-2">
                            ✓ {institutionalPrice.discountPercentage}% bulk discount applied
                          </p>
                        )}
                      </div>

                      <div className="border-t border-green-200 pt-4">
                        <p className="text-sm text-gray-600 mb-2">Total for {numberOfSeats} Learners</p>
                        <p className="text-4xl font-bold text-green-600">
                          {formatPrice(institutionalPrice.totalPrice)}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Subtotal ({numberOfSeats} × {formatPrice(institutionalPrice.pricePerSeat)})</span>
                          <span className="font-semibold text-gray-900">{formatPrice(institutionalPrice.totalPrice)}</span>
                        </div>
                        {institutionalPrice.discountPercentage > 0 && (
                          <div className="flex items-center justify-between text-green-700">
                            <span>Discount ({institutionalPrice.discountPercentage}%)</span>
                            <span className="font-semibold">
                              -{formatPrice(
                                (institutionalPrice.pricePerSeat * numberOfSeats * institutionalPrice.discountPercentage) / 100
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        Request Quote
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Fellowship Pricing */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Elite Fellowship Programs</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {fellowshipTiers.map((tier) => (
              <Card key={tier.name} className="relative overflow-hidden">
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-5`} />
                
                <CardHeader className="relative">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Price</p>
                    <p className="text-4xl font-bold text-gray-900">{formatPrice(tier.price)}</p>
                    <p className="text-xs text-gray-500 mt-1">per year</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Includes:</p>
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Enroll Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Pricing FAQs</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer font-semibold text-gray-900 hover:text-blue-600">
                    Do you offer payment plans?
                    <span className="group-open:rotate-180 transition">▼</span>
                  </summary>
                  <p className="mt-4 text-gray-600">
                    Yes! We offer flexible payment plans for both individual and institutional enrollments. Contact our sales team for details.
                  </p>
                </details>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer font-semibold text-gray-900 hover:text-blue-600">
                    What payment methods do you accept?
                    <span className="group-open:rotate-180 transition">▼</span>
                  </summary>
                  <p className="mt-4 text-gray-600">
                    We accept M-Pesa, bank transfers, and other payment methods. See our Payment Instructions page for details.
                  </p>
                </details>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer font-semibold text-gray-900 hover:text-blue-600">
                    Are there discounts for bulk enrollments?
                    <span className="group-open:rotate-180 transition">▼</span>
                  </summary>
                  <p className="mt-4 text-gray-600">
                    Absolutely! Our bulk discount tiers provide savings up to 50% for large institutional enrollments.
                  </p>
                </details>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer font-semibold text-gray-900 hover:text-blue-600">
                    Can I get a refund?
                    <span className="group-open:rotate-180 transition">▼</span>
                  </summary>
                  <p className="mt-4 text-gray-600">
                    Refunds are available within 7 days of enrollment if you haven't completed more than 10% of the course.
                  </p>
                </details>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
