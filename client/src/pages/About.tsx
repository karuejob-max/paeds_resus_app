import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Target, Users, Zap } from "lucide-react";

export default function About() {
  const team = [
    {
      name: "Dr. Jane Kipchoge",
      role: "Founder & Chief Medical Officer",
      bio: "Pediatric emergency medicine specialist with 15+ years of experience",
      image: "👩‍⚕️",
    },
    {
      name: "James Mwangi",
      role: "Head of Training",
      bio: "Expert in curriculum development and clinical training programs",
      image: "👨‍🏫",
    },
    {
      name: "Sarah Okonkwo",
      role: "Director of Operations",
      bio: "Experienced in healthcare program management and scaling",
      image: "👩‍💼",
    },
    {
      name: "David Kiplagat",
      role: "Technology Lead",
      bio: "Full-stack engineer focused on healthcare technology solutions",
      image: "👨‍💻",
    },
  ];

  const values = [
    {
      icon: Heart,
      title: "Compassion",
      description: "We care deeply about saving children's lives and improving healthcare outcomes",
    },
    {
      icon: Target,
      title: "Excellence",
      description: "We strive for the highest standards in training and education",
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "We believe in the power of teamwork and community",
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We leverage technology to make quality education accessible to all",
    },
  ];

  const milestones = [
    { year: "2020", event: "Paeds Resus founded with vision to transform pediatric emergency care" },
    { year: "2021", event: "Trained first 100 healthcare providers across Kenya" },
    { year: "2022", event: "Expanded to 5 regional training centers" },
    { year: "2023", event: "Launched digital platform and reached 1,000+ learners" },
    { year: "2024", event: "Expanded to East Africa with operations in 4 countries" },
    { year: "2025", event: "Launched Elite Fellowship program and Safe-Truth tool" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Our Story
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            About Paeds Resus
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transforming pediatric emergency care across Africa
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-3 text-blue-900">Our Mission</h3>
                <p className="text-gray-700">
                  A world where no child dies from preventable causes through accessible, world-class training
                </p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-3 text-green-900">Our Vision</h3>
                <p className="text-gray-700">
                  To be the leading pediatric resuscitation training platform in Africa
                </p>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-3 text-purple-900">Our Impact</h3>
                <p className="text-gray-700">
                  Empowering healthcare providers to save thousands of children lives
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="text-center">
                  <CardContent className="pt-6">
                    <Icon className="w-10 h-10 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                    <p className="text-gray-600 text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
          <div className="space-y-6">
            {milestones.map((milestone, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white font-bold">
                    {milestone.year.slice(-2)}
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="font-semibold text-lg text-gray-900">{milestone.year}</h3>
                  <p className="text-gray-600 mt-1">{milestone.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Leadership Team</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {team.map((member) => (
              <Card key={member.name} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-5xl mb-4">{member.image}</div>
                  <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                  <p className="text-blue-600 font-medium text-sm mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <p className="text-blue-100">Healthcare Providers Trained</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4</div>
              <p className="text-blue-100">Countries</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <p className="text-blue-100">Children Impacted</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <p className="text-blue-100">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Mission</h2>
          <p className="text-xl text-gray-600 mb-8">
            Be part of a movement to save children lives across Africa
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start Training
            </Button>
            <Button size="lg" variant="outline">
              Partner With Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
