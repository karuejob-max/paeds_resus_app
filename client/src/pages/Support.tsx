import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HelpCircle, Mail, MessageSquare, Phone, Clock, BookOpen, AlertCircle, MessageCircle } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function Support() {
  const supportChannels = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us an email and we'll respond within 24 hours",
      contact: "paedsresus254@gmail.com",
      link: "mailto:paedsresus254@gmail.com",
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Call us during business hours (Mon-Fri, 9am-5pm EAT)",
      contact: "+254 706 781 260",
      link: "tel:+254706781260",
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      contact: "Available 9am-5pm EAT",
      link: "#",
    },
    {
      icon: BookOpen,
      title: "Knowledge Base",
      description: "Browse our comprehensive help documentation",
      contact: "Explore articles and guides",
      link: "/faq",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Support",
      description: "Chat with us on WhatsApp for instant support",
      contact: "+254 706 781 260",
      link: "https://wa.me/254706781260",
    },
  ];

  const commonIssues = [
    {
      title: "How do I reset my password?",
      answer: "Click on 'Forgot Password' on the login page and follow the instructions sent to your email.",
    },
    {
      title: "How do I enroll in a course?",
      answer: "Navigate to the course page and click 'Enroll Now'. Complete the enrollment form and payment to get started.",
    },
    {
      title: "How do I download my certificate?",
      answer: "Go to 'My Certificates' in your dashboard and click the download button next to your completed course.",
    },
    {
      title: "What payment methods do you accept?",
      answer: "We accept M-Pesa, bank transfers, and other payment methods. See our Payment Instructions page for details.",
    },
    {
      title: "How do I contact my trainer?",
      answer: "You can message your trainer directly through the course dashboard or email them at the address provided in the course details.",
    },
    {
      title: "Can I get a refund?",
      answer: "Refunds are available within 7 days of enrollment if you haven't completed more than 10% of the course. Contact support for assistance.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
              <p className="text-gray-600">
                Get support and find answers to your questions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Input
                  placeholder="Search for help articles..."
                  className="pr-12"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-gray-400">🔍</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {supportChannels.map((channel, idx) => {
              const Icon = channel.icon;
              return (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <Icon className="w-8 h-8 text-blue-600 mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {channel.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {channel.description}
                    </p>
                    <p className="text-sm font-medium text-gray-900 mb-4">
                      {channel.contact}
                    </p>
                    {channel.title === "WhatsApp Support" ? (
                      <WhatsAppButton
                        phoneNumber="254706781260"
                        message="Hello Paeds Resus, I need support with my account."
                        size="sm"
                        className="w-full"
                        label="Open WhatsApp"
                      />
                    ) : (
                      <a href={channel.link}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-sm">
                          Contact
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Common Issues */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Common Questions</h2>
          <div className="space-y-4">
            {commonIssues.map((issue, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer font-semibold text-gray-900 hover:text-blue-600 transition">
                      {issue.title}
                      <span className="group-open:rotate-180 transition">▼</span>
                    </summary>
                    <p className="mt-4 text-gray-600">{issue.answer}</p>
                  </details>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Still need help?
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Can't find what you're looking for? Our support team is here to help. Reach out to us through any of the channels above and we'll get back to you as soon as possible.
                  </p>
                  <div className="flex gap-3">
                    <a href="mailto:paedsresus254@gmail.com">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        Email Support
                      </Button>
                    </a>
                    <a href="/contact">
                      <Button variant="outline">
                        Contact Form
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Response Time Info */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Response Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email Support</p>
                  <p className="font-semibold text-gray-900">24 hours</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Live Chat</p>
                  <p className="font-semibold text-gray-900">Within 1 hour</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone Support</p>
                  <p className="font-semibold text-gray-900">Immediate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
