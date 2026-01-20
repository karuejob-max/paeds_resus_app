import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Award, Users, BookOpen, Heart, Brain, Zap } from "lucide-react";

export default function EliteFellowship() {
  const [selectedModule, setSelectedModule] = useState<string>("head");

  const modules = {
    head: {
      title: "Head - Clinical Excellence",
      icon: Brain,
      color: "bg-blue-50 border-blue-200",
      description: "Master evidence-based pediatric resuscitation protocols",
      topics: [
        "Advanced ACLS and PALS certification",
        "Pediatric trauma management",
        "Neonatal resuscitation",
        "Airway management and intubation",
        "Shock recognition and management",
        "Case study analysis",
      ],
      outcomes: [
        "Certified in advanced pediatric life support",
        "Competent in emergency airway management",
        "Proficient in shock recognition",
        "Expert in evidence-based protocols",
      ],
    },
    heart: {
      title: "Heart - Compassionate Care",
      icon: Heart,
      color: "bg-red-50 border-red-200",
      description: "Develop empathy and patient-centered care skills",
      topics: [
        "Communication with families",
        "Ethical decision-making",
        "Stress management for providers",
        "Cultural competency",
        "Trauma-informed care",
        "Building trust with patients",
      ],
      outcomes: [
        "Enhanced communication skills",
        "Improved family engagement",
        "Better stress management",
        "Culturally competent care delivery",
      ],
    },
    hands: {
      title: "Hands - Practical Skills",
      icon: Zap,
      color: "bg-green-50 border-green-200",
      description: "Develop hands-on clinical and technical skills",
      topics: [
        "High-fidelity simulation training",
        "Procedural skills practice",
        "Team coordination drills",
        "Equipment mastery",
        "Real-world scenario practice",
        "Performance feedback",
      ],
      outcomes: [
        "Mastered critical procedures",
        "Confident in high-pressure situations",
        "Effective team leader",
        "Skilled in equipment operation",
      ],
    },
  };

  const currentModule = modules[selectedModule as keyof typeof modules];
  const IconComponent = currentModule.icon;

  const fellowshipTiers = [
    {
      name: "Bronze Fellow",
      duration: "3 months",
      price: "KES 45,000",
      features: [
        "Online course modules",
        "2 in-person workshops",
        "Certificate of completion",
        "Community access",
      ],
    },
    {
      name: "Silver Fellow",
      duration: "6 months",
      price: "KES 85,000",
      features: [
        "All Bronze features",
        "4 in-person workshops",
        "Mentorship program",
        "Advanced case studies",
        "Continuing education credits",
      ],
      recommended: true,
    },
    {
      name: "Gold Fellow",
      duration: "12 months",
      price: "KES 150,000",
      features: [
        "All Silver features",
        "Monthly masterclasses",
        "One-on-one coaching",
        "Research collaboration",
        "Leadership development",
        "Lifetime community access",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Elite Certification Program
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Paeds Resus Elite Fellowship
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transform into a pediatric resuscitation expert through our comprehensive Head, Heart, and Hands framework
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start Your Fellowship
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Framework Overview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">The Head, Heart, Hands Framework</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {Object.entries(modules).map(([key, module]) => {
              const Icon = module.icon;
              return (
                <Card
                  key={key}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedModule === key ? `${module.color} border-2` : ""
                  }`}
                  onClick={() => setSelectedModule(key)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-8 h-8 text-blue-600" />
                      <CardTitle className="text-xl">{module.title}</CardTitle>
                    </div>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed Module View */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className={`border-2 ${currentModule.color}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <IconComponent className="w-10 h-10 text-blue-600" />
                <div>
                  <CardTitle className="text-2xl">{currentModule.title}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {currentModule.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Topics Covered</h3>
                  <ul className="space-y-3">
                    {currentModule.topics.map((topic, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4">Learning Outcomes</h3>
                  <ul className="space-y-3">
                    {currentModule.outcomes.map((outcome, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Fellowship Tiers */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Fellowship Tiers</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {fellowshipTiers.map((tier, idx) => (
              <Card
                key={idx}
                className={`flex flex-col ${tier.recommended ? "border-2 border-blue-600 shadow-lg" : ""}`}
              >
                {tier.recommended && (
                  <div className="bg-blue-600 text-white px-4 py-2 text-center font-semibold">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>{tier.duration}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-3xl font-bold text-blue-600 mb-6">{tier.price}</div>
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-8"
                    variant={tier.recommended ? "default" : "outline"}
                  >
                    Enroll Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Fellow Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Dr. Sarah Kipchoge",
                role: "PICU Physician, Nairobi Hospital",
                quote:
                  "The Elite Fellowship transformed my approach to pediatric emergencies. The hands-on training was invaluable.",
              },
              {
                name: "Nurse James Mwangi",
                role: "Emergency Nurse, Kenyatta National Hospital",
                quote:
                  "The heart component taught me how to communicate better with families during critical moments.",
              },
              {
                name: "Dr. Emily Okonkwo",
                role: "Pediatrician, Lagos Medical Center",
                quote:
                  "Outstanding program. I've already implemented what I learned with my entire team.",
              },
            ].map((story, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{story.quote}"</p>
                  <p className="font-semibold text-gray-900">{story.name}</p>
                  <p className="text-sm text-gray-600">{story.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Become an Elite Fellow?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of healthcare providers transforming pediatric emergency care
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Start Your Journey
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700">
              Schedule a Consultation
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
