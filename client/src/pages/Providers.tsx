import { Button } from "@/components/ui/button";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, Zap, Clock, Users, Award, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import ProtectedPageWrapper from "@/components/ProtectedPageWrapper";

export default function Providers() {
  const programs = [
    {
      name: "BLS (Basic Life Support)",
      duration: "1 day",
      price: "10,000 KES",
      description: "Essential skills for all healthcare providers. Learn CPR, AED use, and basic airway management.",
      topics: ["CPR Techniques", "AED Operation", "Airway Management", "Recovery Position"],
      icon: Heart,
    },
    {
      name: "ACLS (Advanced Cardiac Life Support)",
      duration: "2 days",
      price: "20,000 KES",
      description: "Advanced cardiac emergency management. Build on BLS with advanced interventions.",
      topics: ["Cardiac Rhythms", "Medication Administration", "Advanced Airway", "Post-Resuscitation Care"],
      icon: Brain,
    },
    {
      name: "PALS (Pediatric Advanced Life Support)",
      duration: "2 days",
      price: "20,000 KES",
      description: "Specialized pediatric resuscitation. Master child-specific emergency protocols.",
      topics: ["Pediatric Assessment", "Shock Management", "Arrhythmia Recognition", "Medication Dosing"],
      icon: Zap,
    },
    {
      name: "Bronze Elite Fellowship",
      duration: "3 months",
      price: "70,000 KES",
      description: "Comprehensive mastery program. Become a resuscitation expert and trainer.",
      topics: ["Head-to-Toe Assessment", "Heart Failure Management", "Hands-On Simulation", "Teaching Skills"],
      icon: Award,
    },
    {
      name: "Silver Elite Fellowship",
      duration: "6 months",
      price: "100,000 KES",
      description: "Advanced certification with clinical mentorship. Develop leadership and research skills.",
      topics: ["Advanced Resuscitation", "Clinical Mentorship", "Research Methodology", "Team Leadership"],
      icon: Award,
    },
    {
      name: "Gold Elite Fellowship",
      duration: "12 months",
      price: "150,000 KES",
      description: "Mastery-level program with institutional leadership focus. Become a change agent.",
      topics: ["Mastery-Level Skills", "Institutional Leadership", "Program Development", "Strategic Planning"],
      icon: Award,
    }
  ];

  const benefits = [
    {
      icon: CheckCircle2,
      title: "Evidence-Based",
      description: "Protocols based on latest AHA guidelines and Kenyan context",
    },
    {
      icon: Users,
      title: "Expert Instructors",
      description: "Trained by experienced PICU nurses and consultants",
    },
    {
      icon: Clock,
      title: "Flexible Scheduling",
      description: "Weekend and evening classes available",
    },
    {
      icon: Award,
      title: "Internationally Recognized",
      description: "Certificates valid across East Africa",
    },
  ];

  return (
    <ProtectedPageWrapper allowedRoles={["provider"]} pageTitle="Provider Programs">
      <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1a4d4d] via-[#0d3333] to-[#052020] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">For Healthcare Providers</h1>
          <p className="text-xl text-orange-100 max-w-2xl">
            Join 500+ elite healthcare professionals who have transformed their resuscitation skills. Get certified in BLS, ACLS, PALS, or pursue our Elite Fellowship.
          </p>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-orange-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center text-[#1a4d4d]">Our Programs</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program) => {
              const Icon = program.icon;
              return (
                <Card key={program.name} className="hover:shadow-lg transition-shadow border-t-4 border-[#ff6633]">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <CardTitle className="text-2xl text-[#1a4d4d]">{program.name}</CardTitle>
                        <CardDescription>{program.duration}</CardDescription>
                      </div>
                      <Icon className="w-8 h-8 text-[#ff6633]" />
                    </div>
                    <div className="text-3xl font-bold text-[#ff6633]">{program.price}</div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-6">{program.description}</p>
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-[#1a4d4d]">What You'll Learn:</h4>
                      <ul className="space-y-2">
                        {program.topics.map((topic) => (
                          <li key={topic} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-[#ff6633]" />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link href="/enroll">
                      <Button className="w-full bg-[#ff6633] hover:bg-[#e55a22]">
                        Enroll Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#1a4d4d]/5 to-[#ff6633]/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center text-[#1a4d4d]">Why Choose Paeds Resus?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card key={benefit.title} className="border-l-4 border-[#ff6633]">
                  <CardHeader>
                    <Icon className="w-8 h-8 text-[#ff6633] mb-4" />
                    <CardTitle className="text-[#1a4d4d]">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center text-[#1a4d4d]">What Providers Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Dr. Jane Kipchoge",
                role: "Emergency Medicine Specialist",
                quote: "The Elite Fellowship transformed how I approach pediatric emergencies. The hands-on simulation is invaluable.",
              },
              {
                name: "Nurse Samuel Omondi",
                role: "PICU Nurse, Kenyatta National Hospital",
                quote: "Finally, a program designed for the Kenyan context. The protocols actually work in our facilities.",
              },
              {
                name: "Dr. Michael Wanjiru",
                role: "Pediatrician, Private Practice",
                quote: "I've recommended Paeds Resus to all my colleagues. The certification is now a standard in our hospital.",
              },
            ].map((testimonial) => (
              <Card key={testimonial.name} className="border-l-4 border-[#ff6633]">
                <CardContent className="pt-6">
                  <p className="text-gray-600 mb-4 italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-[#1a4d4d]">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#1a4d4d] to-[#0d3333] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Advance Your Skills?</h2>
          <p className="text-xl text-gray-200 mb-8">
            Join our next cohort and become part of Kenya's elite resuscitation community.
          </p>
          <Link href="/enroll">
            <Button size="lg" className="bg-[#ff6633] text-white hover:bg-[#e55a22]">
              Enroll Today
            </Button>
          </Link>
        </div>
      </section>
      </div>
    </ProtectedPageWrapper>
  );
}
