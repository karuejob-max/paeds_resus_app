import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  CheckCircle2,
  Briefcase,
  TrendingUp,
  Globe,
  Share2,
  Download,
  Zap,
  Users,
  DollarSign,
} from "lucide-react";

export default function CertificationMarketplace() {
  const certifications = [
    {
      name: "BLS Certification",
      issuer: "Paeds Resus",
      validity: "2 years",
      holders: 18500,
      value: "KES 10,000",
      demand: "Very High",
      icon: "🏥",
    },
    {
      name: "ACLS Certification",
      issuer: "Paeds Resus + AHA",
      validity: "2 years",
      holders: 15200,
      value: "KES 20,000",
      demand: "Very High",
      icon: "❤️",
    },
    {
      name: "PALS Certification",
      issuer: "Paeds Resus + AHA",
      validity: "2 years",
      holders: 12300,
      value: "KES 20,000",
      demand: "High",
      icon: "👶",
    },
    {
      name: "Trauma Management",
      issuer: "Paeds Resus",
      validity: "3 years",
      holders: 8900,
      value: "KES 25,000",
      demand: "High",
      icon: "🚑",
    },
    {
      name: "Pediatric Resus Elite",
      issuer: "Paeds Resus",
      validity: "3 years",
      holders: 4200,
      value: "KES 70,000",
      demand: "Medium",
      icon: "⭐",
    },
  ];

  const employers = [
    { name: "Kenyatta National Hospital", positions: 45, avgSalary: "KES 180K" },
    { name: "Aga Khan Hospital", positions: 32, avgSalary: "KES 200K" },
    { name: "Nairobi Hospital", positions: 28, avgSalary: "KES 190K" },
    { name: "MP Shah Hospital", positions: 18, avgSalary: "KES 175K" },
  ];

  const features = [
    {
      icon: CheckCircle2,
      title: "Blockchain Verification",
      description: "Immutable, tamper-proof credential verification",
    },
    {
      icon: Globe,
      title: "Global Recognition",
      description: "Credentials recognized by 50+ countries",
    },
    {
      icon: Briefcase,
      title: "Job Matching",
      description: "Connect with employers seeking certified professionals",
    },
    {
      icon: DollarSign,
      title: "Salary Transparency",
      description: "See average salaries for certified roles",
    },
    {
      icon: Share2,
      title: "Social Sharing",
      description: "Share credentials on LinkedIn and professional networks",
    },
    {
      icon: TrendingUp,
      title: "Career Advancement",
      description: "Track career growth and salary progression",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero */}
      <section className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Award className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Certification Marketplace</h1>
          </div>
          <p className="text-xl text-purple-100 max-w-2xl">
            Verify, showcase, and monetize your healthcare credentials. Connect with employers and advance your career.
          </p>
          <div className="mt-8 flex gap-4">
            <Button className="bg-white text-purple-900 hover:bg-purple-50">
              <Award className="w-4 h-4 mr-2" />
              View My Credentials
            </Button>
            <Button variant="outline" className="text-white border-white hover:bg-purple-700">
              Browse Jobs
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="w-8 h-8 text-purple-600 mx-auto mb-4" />
              <p className="text-3xl font-bold text-slate-900">58,000+</p>
              <p className="text-slate-600 mt-2">Certified Professionals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Briefcase className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <p className="text-3xl font-bold text-slate-900">450+</p>
              <p className="text-slate-600 mt-2">Active Job Listings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-4" />
              <p className="text-3xl font-bold text-slate-900">+35%</p>
              <p className="text-slate-600 mt-2">Salary Increase</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 text-orange-600 mx-auto mb-4" />
              <p className="text-3xl font-bold text-slate-900">180+</p>
              <p className="text-slate-600 mt-2">Hiring Employers</p>
            </CardContent>
          </Card>
        </div>

        {/* Certifications */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Available Certifications</h2>
          <div className="space-y-4">
            {certifications.map((cert, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{cert.icon}</span>
                        <div>
                          <h3 className="font-bold text-slate-900">{cert.name}</h3>
                          <p className="text-sm text-slate-600">{cert.issuer}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="mb-2">{cert.demand}</Badge>
                      <p className="text-sm text-slate-600">{cert.holders.toLocaleString()} holders</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-600">Validity</p>
                      <p className="font-semibold text-slate-900">{cert.validity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Market Value</p>
                      <p className="font-semibold text-slate-900">{cert.value}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Avg Salary Bump</p>
                      <p className="font-semibold text-green-600">+KES 25K</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button className="flex-1" size="sm">
                      <Award className="w-4 h-4 mr-2" />
                      Earn This
                    </Button>
                    <Button variant="outline" className="flex-1" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Marketplace Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <Icon className="w-8 h-8 text-purple-600 mb-4" />
                    <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Employers */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Top Hiring Employers</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {employers.map((employer, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-slate-900 mb-4">{employer.name}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Open Positions</span>
                      <span className="font-semibold text-slate-900">{employer.positions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Avg Salary</span>
                      <span className="font-semibold text-slate-900">{employer.avgSalary}</span>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      View Jobs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Blockchain Verification */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Blockchain-Verified Credentials</CardTitle>
            <CardDescription>Your credentials are secured on the blockchain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 border rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600 mb-2" />
                <p className="font-bold text-slate-900 mb-1">Tamper-Proof</p>
                <p className="text-sm text-slate-600">Credentials cannot be forged or altered</p>
              </div>
              <div className="p-4 border rounded-lg">
                <Globe className="w-6 h-6 text-blue-600 mb-2" />
                <p className="font-bold text-slate-900 mb-1">Globally Recognized</p>
                <p className="text-sm text-slate-600">Verified by employers worldwide</p>
              </div>
              <div className="p-4 border rounded-lg">
                <Zap className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-bold text-slate-900 mb-1">Instant Verification</p>
                <p className="text-sm text-slate-600">Employers verify in seconds</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="pt-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Showcase Your Credentials</h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                Build your professional profile, verify your certifications, and connect with top employers.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <Award className="w-5 h-5 mr-2" />
                  Create Profile
                </Button>
                <Button size="lg" variant="outline">
                  <Download className="w-5 h-5 mr-2" />
                  Download Credentials
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
