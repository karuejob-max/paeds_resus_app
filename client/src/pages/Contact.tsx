import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";


export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    type: "general",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert("Thank you for contacting us. We'll respond within 24 hours.");

      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        type: "general",
      });
    } catch (error) {
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactChannels = [
    {
      icon: Mail,
      title: "Email",
      description: "Send us an email anytime",
      details: "paedsresus254@gmail.com",
      subtext: "Response within 24 hours",
    },
    {
      icon: Phone,
      title: "Phone",
      description: "Call our support team",
      details: "+254 706 781 260",
      subtext: "Mon-Fri, 8am-5pm EAT",
    },
    {
      icon: MapPin,
      title: "Office",
      description: "Visit us in person",
      details: "Nairobi, Kenya",
      subtext: "By appointment",
    },
    {
      icon: Clock,
      title: "Live Chat",
      description: "Chat with us online",
      details: "Available on website",
      subtext: "Real-time support",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      description: "Instant messaging support",
      details: "+254 706 781 260",
      subtext: "Fastest response time",
    },
  ];

  const contactTypes = [
    { value: "general", label: "General Inquiry" },
    { value: "enrollment", label: "Enrollment Question" },
    { value: "technical", label: "Technical Support" },
    { value: "institutional", label: "Institutional Partnership" },
    { value: "feedback", label: "Feedback" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Get in Touch
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Channels */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Ways to Reach Us</h2>
          <div className="grid md:grid-cols-5 gap-6">
            {contactChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <Card key={channel.title} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 flex flex-col h-full">
                    <Icon className="w-10 h-10 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{channel.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 flex-grow">{channel.description}</p>
                    <p className="font-mono font-semibold text-gray-900 mb-1">{channel.details}</p>
                    <p className="text-xs text-gray-500 mb-4">{channel.subtext}</p>
                    {channel.title === "WhatsApp" && (
                      <WhatsAppButton
                        phoneNumber="254706781260"
                        message="Hello Paeds Resus, I would like to inquire about your training programs."
                        size="sm"
                        className="w-full"
                        label="Open Chat"
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+254 706 781 260"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Inquiry Type *</Label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {contactTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What is this about?"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Locations</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Nairobi Headquarters</CardTitle>
                <CardDescription>Main office and training center</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Address</p>
                  <p className="font-semibold">Paeds Resus Limited</p>
                  <p className="text-gray-700">Nairobi, Kenya</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="font-semibold">+254 706 781 260</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-semibold">paedsresus254@gmail.com</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hours</p>
                  <p className="font-semibold">Mon-Fri: 8am - 5pm EAT</p>
                  <p className="text-gray-700">Sat-Sun: Closed</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Centers</CardTitle>
                <CardDescription>Training locations across East Africa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-blue-600 pl-4">
                  <p className="font-semibold">Mombasa</p>
                  <p className="text-sm text-gray-600">Coastal training center</p>
                </div>
                <div className="border-l-4 border-blue-600 pl-4">
                  <p className="font-semibold">Kisumu</p>
                  <p className="text-sm text-gray-600">Western region center</p>
                </div>
                <div className="border-l-4 border-blue-600 pl-4">
                  <p className="font-semibold">Dar es Salaam</p>
                  <p className="text-sm text-gray-600">Tanzania operations</p>
                </div>
                <div className="border-l-4 border-blue-600 pl-4">
                  <p className="font-semibold">Kampala</p>
                  <p className="text-sm text-gray-600">Uganda operations</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Quick Help</h2>
          <p className="text-xl text-gray-600 mb-8">
            Check our FAQ section for quick answers to common questions
          </p>
          <Button size="lg">Browse FAQs</Button>
        </div>
      </section>
    </div>
  );
}
