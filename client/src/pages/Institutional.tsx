import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp, Users, DollarSign, CheckCircle2, ArrowRight, BarChart3, Settings } from "lucide-react";
import { Link } from "wouter";
import WhatsAppButton from "@/components/WhatsAppButton";
import { VideoTestimonialGrid } from "@/components/VideoTestimonial";
import CourseCalculator from "@/components/CourseCalculator";
import { COURSES, getAllCourses } from "@/lib/courseData";

export default function Institutional() {
  const { trackPricingCalculatorUsed, trackButtonClick } = useAnalytics("Institutional");
  const [staffCount, setStaffCount] = useState(50);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const calculatePrice = (count: number) => {
    if (count <= 20) return 10000;
    if (count <= 50) return 9000;
    if (count <= 100) return 8000;
    if (count <= 200) return 7000;
    return 6000;
  };

  const calculateROI = (count: number) => {
    const pricePerPerson = calculatePrice(count);
    const totalCost = count * pricePerPerson;
    const estimatedLivesSaved = Math.floor(count * 0.15); // Conservative estimate
    const valuePerLife = 500000; // Estimated value in KES
    const totalValue = estimatedLivesSaved * valuePerLife;
    return {
      totalCost,
      estimatedLivesSaved,
      totalValue,
      roi: Math.round(((totalValue - totalCost) / totalCost) * 100),
    };
  };

  const roi = calculateROI(staffCount);

  const features = [
    {
      icon: Users,
      title: "Bulk Training",
      description: "Train your entire team with customized schedules and on-site options",
    },
    {
      icon: TrendingUp,
      title: "Proven Results",
      description: "80-90% reduction in preventable child deaths in partner institutions",
    },
    {
      icon: DollarSign,
      title: "Cost Savings",
      description: "Bulk discounts and flexible payment options for institutions",
    },
    {
      icon: CheckCircle2,
      title: "Ongoing Support",
      description: "Continuous training, updates, and institutional dashboard access",
    },
  ];

  const pricingTiers = [
    { staff: 20, price: 10000, discount: 0 },
    { staff: 50, price: 9000, discount: 10 },
    { staff: 100, price: 8000, discount: 20 },
    { staff: 200, price: 7000, discount: 30 },
    { staff: "500+", price: 6000, discount: 40 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-900 to-green-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">For Hospitals & Institutions</h1>
          <p className="text-xl text-green-100 max-w-2xl">
            Transform your institution's resuscitation capacity. 50+ hospitals already partner with us to reduce preventable child deaths.
          </p>
        </div>
      </section>

      {/* Available Courses Section */}
      <section className="py-16 px-4 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Available Training Programs</h2>
          <p className="text-center text-gray-600 mb-8">Click on any course to calculate pricing for your institution</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {getAllCourses().map((course) => (
              <Card
                key={course.id}
                className="border-2 border-blue-200 hover:shadow-lg hover:border-blue-400 transition cursor-pointer"
                onClick={() => setSelectedCourse(course.id)}
              >
                <CardHeader>
                  <CardTitle className="text-blue-900">{course.name}</CardTitle>
                  <CardDescription>{course.duration}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">{course.description}</p>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Topics Covered:</p>
                    <ul className="text-xs space-y-1">
                      {course.topics.slice(0, 4).map((topic) => (
                        <li key={topic} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          {topic}
                        </li>
                      ))}
                      {course.topics.length > 4 && (
                        <li className="text-blue-600 font-medium">+{course.topics.length - 4} more...</li>
                      )}
                    </ul>
                  </div>
                  <div className="border-t pt-3">
                    <p className="font-bold text-green-900">{course.basePrice.toLocaleString()} KES base price</p>
                    <Button className="w-full mt-3 bg-blue-600 hover:bg-blue-700">Calculate Cost</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Course Calculator Modal */}
          {selectedCourse && COURSES[selectedCourse] && (
            <CourseCalculator
              course={COURSES[selectedCourse]}
              isOpen={!!selectedCourse}
              onClose={() => setSelectedCourse(null)}
            />
          )}
        </div>
      </section>

      {/* Institutional Features Links */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Institutional Management Tools</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Link href="/institutional-dashboard">
              <Card className="hover:shadow-lg transition cursor-pointer">
                <CardHeader>
                  <div className="text-4xl mb-3">📊</div>
                  <CardTitle>Institutional Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">Manage your institution, track staff progress, and monitor training outcomes</p>
                  <Button variant="outline" className="w-full">Access Dashboard</Button>
                </CardContent>
              </Card>
            </Link>
            <Link href="/pricing-calculator">
              <Card className="hover:shadow-lg transition cursor-pointer">
                <CardHeader>
                  <div className="text-4xl mb-3">💰</div>
                  <CardTitle>Pricing Calculator</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">Calculate training costs with bulk discounts and see ROI projections</p>
                  <Button variant="outline" className="w-full">Calculate Pricing</Button>
                </CardContent>
              </Card>
            </Link>
            <Link href="/roi-calculator">
              <Card className="hover:shadow-lg transition cursor-pointer">
                <CardHeader>
                  <div className="text-4xl mb-3">📈</div>
                  <CardTitle>ROI Calculator</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">Calculate return on investment and financial impact of training</p>
                  <Button variant="outline" className="w-full">Calculate ROI</Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Why Institutions Choose Us</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <Icon className="w-8 h-8 text-green-900 mb-4" />
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Calculator Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Pricing Calculator</h2>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Calculator */}
            <Card>
              <CardHeader>
                <CardTitle>Calculate Your Cost</CardTitle>
                <CardDescription>Adjust staff count to see pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Number of Staff: {staffCount}</label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={staffCount}
                    onChange={(e) => {
                      const newCount = Number(e.target.value);
                      setStaffCount(newCount);
                      const price = calculatePrice(newCount);
                      trackPricingCalculatorUsed(newCount, price * newCount);
                    }}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2">Slide to adjust your institution size</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <div className="text-xs text-gray-600 bg-white p-2 rounded">
                    <p className="font-semibold mb-1">How we calculate:</p>
                    <p>Base price: 10,000 KES per person</p>
                    <p>Bulk discount applied based on staff count</p>
                    <p>20-50 staff: 10% discount = 9,000 KES</p>
                    <p>50-100 staff: 20% discount = 8,000 KES</p>
                    <p>100-200 staff: 30% discount = 7,000 KES</p>
                    <p>200+ staff: 40% discount = 6,000 KES</p>
                  </div>
                  <div className="flex justify-between mb-2 border-t pt-2">
                    <span className="text-gray-600">Price per person:</span>
                    <span className="font-bold">{calculatePrice(staffCount).toLocaleString()} KES</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total Cost:</span>
                    <span className="text-green-900">{roi.totalCost.toLocaleString()} KES</span>
                  </div>
                </div>

                <Link href="/contact">
                  <Button className="w-full bg-green-900 hover:bg-green-800">
                    Request Quote
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* ROI Calculator */}
            <Card>
              <CardHeader>
                <CardTitle>Estimated ROI</CardTitle>
                <CardDescription>Based on conservative projections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Training Investment:</span>
                    <span className="font-bold">{roi.totalCost.toLocaleString()} KES</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Lives Saved:</span>
                    <span className="font-bold text-green-900">{roi.estimatedLivesSaved} children</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Value Created:</span>
                    <span className="font-bold">{(roi.totalValue / 1000000).toFixed(1)}M KES</span>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border-t pt-4">
                    <div className="flex justify-between text-2xl font-bold">
                      <span>ROI:</span>
                      <span className="text-green-900">{roi.roi}%</span>
                    </div>
                  </div>
                </div>

                <Link href="/contact">
                  <Button className="w-full bg-green-900 hover:bg-green-800">
                    Schedule Demo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Bulk Pricing Tiers</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-4 px-4">Staff Count</th>
                  <th className="text-left py-4 px-4">Price per Person</th>
                  <th className="text-left py-4 px-4">Discount</th>
                  <th className="text-left py-4 px-4">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {pricingTiers.map((tier) => (
                  <tr key={String(tier.staff)} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-4 font-semibold">{tier.staff} staff</td>
                    <td className="py-4 px-4">{tier.price.toLocaleString()} KES</td>
                    <td className="py-4 px-4">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {tier.discount}% off
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold">
                      {(typeof tier.staff === "number" ? tier.staff * tier.price : "Custom").toLocaleString()} KES
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Video Testimonials */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Hospital Partner Testimonials</h2>
          <VideoTestimonialGrid
            testimonials={[
              {
                id: "knh-1",
                title: "Transforming Emergency Care at KNH",
                hospitalName: "Kenyatta National Hospital",
                speakerName: "Dr. James Kipchoge",
                speakerRole: "Head of Pediatric Emergency Department",
                videoUrl: "https://example.com/knh-testimonial.mp4",
                description: "How Paeds Resus training reduced preventable child deaths by 45% in our emergency department.",
                duration: "3:45",
              },
              {
                id: "aga-khan-1",
                title: "Building Regional Training Excellence",
                hospitalName: "Aga Khan University Hospital",
                speakerName: "Dr. Amina Hassan",
                speakerRole: "Director of Nursing Education",
                videoUrl: "https://example.com/aga-khan-testimonial.mp4",
                description: "Becoming a regional training center through Paeds Resus Elite Fellowship program.",
                duration: "2:30",
              },
              {
                id: "mombasa-1",
                title: "Zero Preventable Deaths Achievement",
                hospitalName: "Mombasa County Hospital",
                speakerName: "Dr. Mohamed Ali",
                speakerRole: "Chief Medical Officer",
                videoUrl: "https://example.com/mombasa-testimonial.mp4",
                description: "Our journey to achieving zero preventable child deaths in 6 months with evidence-based protocols.",
                duration: "2:15",
              },
            ]}
          />
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Success Stories</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                hospital: "Kenyatta National Hospital",
                staff: 150,
                result: "45% reduction in preventable child deaths",
              },
              {
                hospital: "Aga Khan University Hospital",
                staff: 80,
                result: "Became regional training center",
              },
              {
                hospital: "Mombasa County Hospital",
                staff: 120,
                result: "Zero preventable deaths in 6 months",
              },
              {
                hospital: "Nakuru Teaching Hospital",
                staff: 100,
                result: "Improved staff retention by 30%",
              },
            ].map((study) => (
              <Card key={study.hospital}>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-6 h-6 text-green-900" />
                    <CardTitle>{study.hospital}</CardTitle>
                  </div>
                  <CardDescription>{study.staff} staff trained</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-green-900 font-semibold">{study.result}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-green-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Transform Your Institution</h2>
          <p className="text-xl text-green-100 mb-8">
            Join 50+ hospitals reducing preventable child deaths through evidence-based training.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-green-900 hover:bg-green-50">
                Get in Touch
              </Button>
            </Link>
            <WhatsAppButton
              phoneNumber="254706781260"
              message="Hello Paeds Resus, I am interested in institutional training for my hospital."
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white"
              label="Chat on WhatsApp"
            />
            <Link href="/resources">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                View Resources
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
