import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Globe, Users, TrendingUp, Mail, Phone, MessageSquare, BarChart3 } from "lucide-react";

export default function MarketingCampaign() {
  useScrollToTop();

  const campaigns = [
    {
      name: "Healthcare Institutions",
      description: "Target hospitals, clinics, and health systems across Kenya",
      target: "500+ institutions",
      budget: "KES 2,000,000",
      channels: ["Email", "LinkedIn", "Direct Sales", "Webinars"],
      roi: "400%",
      status: "Active",
    },
    {
      name: "Individual Providers",
      description: "Reach doctors, nurses, and healthcare professionals",
      target: "5,000+ providers",
      budget: "KES 1,500,000",
      channels: ["Social Media", "Email", "Webinars", "Referral"],
      roi: "350%",
      status: "Active",
    },
    {
      name: "International Markets",
      description: "Expand to East Africa, West Africa, and beyond",
      target: "10+ countries",
      budget: "KES 5,000,000",
      channels: ["Partnerships", "Local Influencers", "Trade Shows", "Digital Ads"],
      roi: "500%",
      status: "Planning",
    },
    {
      name: "Parent/Caregiver",
      description: "Educate families on life-saving skills",
      target: "50,000+ families",
      budget: "KES 1,000,000",
      channels: ["Facebook", "WhatsApp", "Community Centers", "Schools"],
      roi: "300%",
      status: "Active",
    },
  ];

  const marketingMetrics = [
    { metric: "Total Reach", value: "65,000+", icon: Globe },
    { metric: "Conversion Rate", value: "12.5%", icon: TrendingUp },
    { metric: "Cost Per Acquisition", value: "KES 800", icon: Target },
    { metric: "Customer Lifetime Value", value: "KES 45,000", icon: BarChart3 },
  ];

  const channels = [
    {
      name: "Email Marketing",
      description: "Targeted campaigns to healthcare professionals",
      reach: "15,000+",
      cost: "KES 50,000/month",
      roi: "450%",
    },
    {
      name: "Social Media",
      description: "Facebook, Instagram, LinkedIn, Twitter campaigns",
      reach: "25,000+",
      cost: "KES 75,000/month",
      roi: "380%",
    },
    {
      name: "Direct Sales",
      description: "Sales team targeting institutional clients",
      reach: "500+",
      cost: "KES 200,000/month",
      roi: "600%",
    },
    {
      name: "Webinars & Events",
      description: "Live training sessions and industry events",
      reach: "2,000+",
      cost: "KES 100,000/month",
      roi: "420%",
    },
    {
      name: "Partnerships",
      description: "Collaborations with health organizations",
      reach: "10,000+",
      cost: "KES 150,000/month",
      roi: "520%",
    },
    {
      name: "Referral Program",
      description: "Incentivized referrals from existing users",
      reach: "5,000+",
      cost: "KES 100,000/month",
      roi: "480%",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Marketing Campaign</h1>
          <p className="text-gray-600">Go-to-market strategy and campaign management</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {marketingMetrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">{metric.metric}</CardTitle>
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Active Campaigns */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Campaigns</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {campaigns.map((campaign, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle>{campaign.name}</CardTitle>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      campaign.status === "Active" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  <CardDescription>{campaign.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Target Audience</p>
                        <p className="font-semibold text-gray-900">{campaign.target}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Budget</p>
                        <p className="font-semibold text-gray-900">{campaign.budget}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Expected ROI</p>
                        <p className="font-semibold text-green-600">{campaign.roi}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Channels</p>
                        <p className="text-sm text-gray-900">{campaign.channels.length} channels</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Marketing Channels</p>
                      <div className="flex flex-wrap gap-2">
                        {campaign.channels.map((channel, cidx) => (
                          <span key={cidx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {channel}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Marketing Channels */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Marketing Channels</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {channels.map((channel, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{channel.name}</CardTitle>
                  <CardDescription>{channel.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Estimated Reach</span>
                      <span className="font-semibold text-gray-900">{channel.reach}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Cost</span>
                      <span className="font-semibold text-gray-900">{channel.cost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Expected ROI</span>
                      <span className="font-semibold text-green-600">{channel.roi}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact & Support */}
        <Card>
          <CardHeader>
            <CardTitle>Marketing Support & Contact</CardTitle>
            <CardDescription>Get help with campaigns and partnerships</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Email Support</h4>
                  <p className="text-sm text-gray-600">marketing@paeds-resus.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Phone Support</h4>
                  <p className="text-sm text-gray-600">+254 700 123 456</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MessageSquare className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">WhatsApp</h4>
                  <p className="text-sm text-gray-600">+254 700 123 456</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
