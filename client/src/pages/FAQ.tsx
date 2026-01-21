import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Search } from "lucide-react";

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const faqs = [
    {
      id: "enrollment-1",
      category: "Enrollment",
      question: "How do I enroll in a Paeds Resus program?",
      answer:
        "Visit our enrollment page and select your preferred program. Fill in your details, choose your payment method, and complete the payment. You'll receive confirmation via email and SMS within 24 hours.",
    },
    {
      id: "enrollment-2",
      category: "Enrollment",
      question: "What are the prerequisites for enrollment?",
      answer:
        "Basic requirements include being a healthcare professional or student in a health-related field. Specific programs may have additional requirements. Check the program details page for specific prerequisites.",
    },
    {
      id: "enrollment-3",
      category: "Enrollment",
      question: "Can I enroll multiple team members from my institution?",
      answer:
        "Yes! We offer bulk enrollment discounts for institutions. Contact our institutional partnerships team at institutional@paedsresus.com for custom pricing.",
    },
    {
      id: "enrollment-4",
      category: "Enrollment",
      question: "What is the age requirement for enrollment?",
      answer:
        "Participants must be at least 18 years old. Healthcare professionals of any age with valid credentials are welcome to enroll.",
    },
    {
      id: "payment-1",
      category: "Payment",
      question: "What payment methods do you accept?",
      answer:
        "We accept M-Pesa (instant payment) and bank transfers. M-Pesa is recommended for quick processing. Visit our payment instructions page for detailed steps.",
    },
    {
      id: "payment-2",
      category: "Payment",
      question: "How long does payment processing take?",
      answer:
        "M-Pesa payments are processed instantly. Bank transfers typically take 1-2 business days. You'll receive a confirmation email once payment is received.",
    },
    {
      id: "payment-3",
      category: "Payment",
      question: "Is there a refund policy?",
      answer:
        "Yes, we offer refunds within 7 days of payment if you haven't started the program. After 7 days, refunds are not available but you can transfer your enrollment to another person.",
    },
    {
      id: "payment-4",
      category: "Payment",
      question: "Do you offer payment plans?",
      answer:
        "For institutional bulk payments, we can arrange custom payment plans. Contact institutional@paedsresus.com to discuss options.",
    },
    {
      id: "program-1",
      category: "Programs",
      question: "What programs do you offer?",
      answer:
        "We offer Elite Fellowship (3, 6, and 12-month programs), Standard Certification, and Specialized Modules. Visit our programs page to see all available options.",
    },
    {
      id: "program-2",
      category: "Programs",
      question: "How long does each program take?",
      answer:
        "Program duration varies: Elite Fellowship ranges from 3-12 months, Standard Certification is 6 weeks, and Specialized Modules are 2-4 weeks. You can study at your own pace.",
    },
    {
      id: "program-3",
      category: "Programs",
      question: "Are the programs accredited?",
      answer:
        "Yes, our programs are accredited by the Kenya Medical Practitioners and Dentists Board (KMPDB) and recognized internationally. Certificates are valid globally.",
    },
    {
      id: "program-4",
      category: "Programs",
      question: "Can I access the program materials offline?",
      answer:
        "Yes! Our platform supports offline access. Download course materials on WiFi and access them anytime, anywhere. Perfect for areas with limited connectivity.",
    },
    {
      id: "certificate-1",
      category: "Certificates",
      question: "How do I get my certificate?",
      answer:
        "Certificates are automatically generated upon completion of all program requirements. You'll receive a digital certificate via email and can download it from your dashboard.",
    },
    {
      id: "certificate-2",
      category: "Certificates",
      question: "How do I verify a certificate?",
      answer:
        "Visit our certificate verification page and enter the certificate number. You can verify any Paeds Resus certificate issued in the last 5 years.",
    },
    {
      id: "certificate-3",
      category: "Certificates",
      question: "Can I get a physical copy of my certificate?",
      answer:
        "Yes, we can send a physical certificate for an additional fee. Contact paedsresus254@gmail.com with your certificate number and mailing address.",
    },
    {
      id: "certificate-4",
      category: "Certificates",
      question: "How long are certificates valid?",
      answer:
        "Paeds Resus certificates are valid for 3 years. After that, you can renew by completing a refresher course at a discounted rate.",
    },
    {
      id: "support-1",
      category: "Support",
      question: "How do I contact customer support?",
      answer:
        "You can reach us via email (paedsresus254@gmail.com), phone (+254 706 781 260), or live chat on our website. We respond within 24 hours.",
    },
    {
      id: "support-2",
      category: "Support",
      question: "What are your support hours?",
      answer:
        "Our support team is available Monday-Friday, 8am-5pm EAT. For urgent issues outside these hours, please leave a message and we'll respond the next business day.",
    },
    {
      id: "support-3",
      category: "Support",
      question: "I forgot my password. What should I do?",
      answer:
        "Click the 'Forgot Password' link on the login page. Enter your email address and you'll receive a password reset link within 5 minutes.",
    },
    {
      id: "support-4",
      category: "Support",
      question: "Can I change my enrolled program?",
      answer:
        "Yes, you can switch programs within 7 days of enrollment. After 7 days, please contact paedsresus254@gmail.com to discuss options."
    },
    {
      id: "technical-1",
      category: "Technical",
      question: "What devices can I use to access the platform?",
      answer:
        "Our platform works on desktop, tablet, and mobile devices. We support iOS, Android, Windows, and Mac. Use the latest version of Chrome, Firefox, Safari, or Edge for best experience.",
    },
    {
      id: "technical-2",
      category: "Technical",
      question: "What is the minimum internet speed required?",
      answer:
        "For video content, we recommend at least 2 Mbps. For basic course materials, 1 Mbps is sufficient. Our platform automatically adjusts video quality based on your connection.",
    },
    {
      id: "technical-3",
      category: "Technical",
      question: "Can I download course materials?",
      answer:
        "Yes, all course materials including PDFs, videos, and resources can be downloaded for offline access. Use the download button on each lesson.",
    },
    {
      id: "technical-4",
      category: "Technical",
      question: "Is the platform secure?",
      answer:
        "Yes, we use SSL encryption, two-factor authentication, and comply with GDPR and HIPAA standards. Your data is protected with enterprise-grade security.",
    },
  ];

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesSearch =
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || faq.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers to common questions about our programs, enrollment, and support
          </p>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-3 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white border-b">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Filter by Category</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              size="sm"
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {filteredFaqs.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-gray-600 text-lg">No FAQs found matching your search.</p>
                <p className="text-gray-500 mt-2">Try different keywords or browse all categories.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => (
                <Card
                  key={faq.id}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{faq.category}</Badge>
                        </div>
                        <CardTitle className="text-lg text-left">{faq.question}</CardTitle>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                          expandedId === faq.id ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CardHeader>

                  {expandedId === faq.id && (
                    <CardContent className="border-t pt-4">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </CardContent>
                  )}
                </Card>
              ))}

              {filteredFaqs.length > 0 && (
                <p className="text-center text-gray-600 mt-8">
                  Showing {filteredFaqs.length} of {faqs.length} FAQs
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Still Have Questions?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Our support team is ready to help you
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Email Support</h3>
                <p className="text-gray-600 mb-4">paedsresus254@gmail.com</p>
                <Button variant="outline" className="w-full">
                  Send Email
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Phone Support</h3>
                <p className="text-gray-600 mb-4">+254 706 781 260</p>
                <Button variant="outline" className="w-full">
                  Call Us
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Live Chat</h3>
                <p className="text-gray-600 mb-4">Chat with our team</p>
                <Button variant="outline" className="w-full">
                  Start Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
