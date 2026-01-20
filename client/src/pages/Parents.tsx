import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, AlertCircle, BookOpen, Video, Users, Shield, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function Parents() {
  const modules = [
    {
      icon: AlertCircle,
      title: "Recognize Emergencies",
      description: "Learn to identify when your child needs immediate help",
      topics: ["Signs of choking", "Difficulty breathing", "Unconsciousness", "Severe bleeding"],
    },
    {
      icon: Heart,
      title: "CPR for Children",
      description: "Master life-saving CPR techniques for infants and children",
      topics: ["Hand placement", "Compression depth", "Rescue breathing", "Recovery position"],
    },
    {
      icon: Shield,
      title: "First Aid Basics",
      description: "Essential first aid skills for common childhood injuries",
      topics: ["Wound care", "Burn treatment", "Fracture immobilization", "Poison management"],
    },
    {
      icon: BookOpen,
      title: "Prevention",
      description: "How to prevent common childhood emergencies",
      topics: ["Home safety", "Water safety", "Choking prevention", "Accident prevention"],
    },
  ];

  const benefits = [
    "Gain confidence in emergency situations",
    "Learn skills that could save your child's life",
    "Understand when to seek professional help",
    "Know how to support medical professionals",
    "Create a safer home environment",
    "Join a supportive community of parents",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 to-purple-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">For Parents & Caregivers</h1>
          <p className="text-xl text-purple-100 max-w-2xl">
            Every parent should know CPR. Learn life-saving skills to protect your children and family. Our parent-friendly courses make emergency response accessible to everyone.
          </p>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="py-16 px-4 bg-red-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-100 border-l-4 border-red-600 p-6 rounded">
            <h3 className="text-2xl font-bold text-red-900 mb-4">Why Every Parent Needs to Know CPR</h3>
            <ul className="space-y-3 text-red-800">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-1" />
                <span><strong>First 4 minutes matter:</strong> CPR performed in the first 4 minutes can double or triple survival chances</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-1" />
                <span><strong>You're the first responder:</strong> Medical help may take 10+ minutes to arrive</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-1" />
                <span><strong>Confidence saves lives:</strong> Trained parents act faster and more effectively</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Learning Modules */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">What You'll Learn</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Card key={module.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <Icon className="w-6 h-6 text-purple-900" />
                      </div>
                      <div>
                        <CardTitle>{module.title}</CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {module.topics.map((topic) => (
                        <li key={topic} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-purple-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Benefits of Our Program</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-purple-900 flex-shrink-0 mt-1" />
                <p className="text-lg text-gray-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Options */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Course Options</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Online Course",
                duration: "Self-paced",
                price: "2,000 KES",
                description: "Learn theory online at your own pace",
                features: ["Video lessons", "Quizzes", "Certificate", "Lifetime access"],
              },
              {
                title: "Hands-On Workshop",
                duration: "1 day",
                price: "3,500 KES",
                description: "Practice CPR on mannequins with expert guidance",
                features: ["Live instruction", "Practice CPR", "Certificate", "Q&A session"],
                featured: true,
              },
              {
                title: "Family Package",
                duration: "1 day",
                price: "5,000 KES",
                description: "Train up to 4 family members together",
                features: ["Group training", "Family discount", "Certificates", "Support materials"],
              },
            ].map((course) => (
              <Card key={course.title} className={course.featured ? "border-purple-500 border-2" : ""}>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.duration}</CardDescription>
                  <div className="text-3xl font-bold text-purple-900 mt-4">{course.price}</div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-600">{course.description}</p>
                  <ul className="space-y-2">
                    {course.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/enroll">
                    <Button className={course.featured ? "w-full bg-purple-900 hover:bg-purple-800" : "w-full"}>
                      Enroll Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "Do I need medical experience?",
                a: "No! Our courses are designed for parents with no medical background. We teach everything from scratch.",
              },
              {
                q: "How long is the certification valid?",
                a: "Our certificates are valid for 2 years. We recommend refresher training annually.",
              },
              {
                q: "Can I bring my child to the workshop?",
                a: "Children 12+ can participate in the family package. Younger children can attend the online course.",
              },
              {
                q: "What if I can't attend a scheduled workshop?",
                a: "We offer flexible scheduling with weekend and evening options. Online courses are self-paced.",
              },
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-purple-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Be Prepared. Save Lives.</h2>
          <p className="text-xl text-purple-100 mb-8">
            Start your CPR training today and gain the confidence to protect your family.
          </p>
          <Link href="/enroll">
            <Button size="lg" className="bg-white text-purple-900 hover:bg-purple-50">
              Enroll Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
