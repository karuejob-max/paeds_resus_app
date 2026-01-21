import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Send, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";

export default function EmailCampaignDashboard() {
  const [campaigns, setCampaigns] = useState([
    {
      id: 1,
      name: "Enrollment Confirmation",
      type: "enrollment",
      status: "active",
      frequency: "immediate",
      sent: 245,
      opened: 189,
      clicked: 156,
      converted: 142,
    },
    {
      id: 2,
      name: "Course Completion",
      type: "completion",
      status: "active",
      frequency: "on-completion",
      sent: 89,
      opened: 78,
      clicked: 65,
      converted: 62,
    },
    {
      id: 3,
      name: "Churn Risk Alert",
      type: "churn",
      status: "active",
      frequency: "weekly",
      sent: 156,
      opened: 98,
      clicked: 45,
      converted: 23,
    },
    {
      id: 4,
      name: "Institutional Welcome",
      type: "institutional",
      status: "active",
      frequency: "on-signup",
      sent: 34,
      opened: 32,
      clicked: 28,
      converted: 26,
    },
  ]);

  const calculateMetrics = (campaign: typeof campaigns[0]) => {
    return {
      openRate: campaign.sent > 0 ? Math.round((campaign.opened / campaign.sent) * 100) : 0,
      clickRate: campaign.opened > 0 ? Math.round((campaign.clicked / campaign.opened) * 100) : 0,
      conversionRate: campaign.sent > 0 ? Math.round((campaign.converted / campaign.sent) * 100) : 0,
    };
  };

  const totalStats = {
    totalSent: campaigns.reduce((sum, c) => sum + c.sent, 0),
    totalOpened: campaigns.reduce((sum, c) => sum + c.opened, 0),
    totalConverted: campaigns.reduce((sum, c) => sum + c.converted, 0),
  };

  const overallOpenRate = totalStats.totalSent > 0 ? Math.round((totalStats.totalOpened / totalStats.totalSent) * 100) : 0;
  const overallConversionRate = totalStats.totalSent > 0 ? Math.round((totalStats.totalConverted / totalStats.totalSent) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1a4d4d] mb-2">Email Campaign Dashboard</h1>
        <p className="text-gray-600">Manage and monitor automated email campaigns for user engagement and retention.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Emails Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#ff6633]">{totalStats.totalSent}</div>
            <p className="text-xs text-gray-500 mt-1">All campaigns combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1a4d4d]">{overallOpenRate}%</div>
            <p className="text-xs text-gray-500 mt-1">{totalStats.totalOpened} opens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#ff6633]">{overallConversionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">{totalStats.totalConverted} conversions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1a4d4d]">{campaigns.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-gray-500 mt-1">Running now</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#1a4d4d]">Active Campaigns</h2>
          <Button className="bg-[#ff6633] hover:bg-[#e55a22]">
            <Mail className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>

        {campaigns.map((campaign) => {
          const metrics = calculateMetrics(campaign);
          return (
            <Card key={campaign.id} className="border-l-4 border-[#ff6633]">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-[#1a4d4d]">{campaign.name}</CardTitle>
                    <CardDescription>
                      {campaign.frequency === 'immediate' && '⚡ Sent immediately on trigger'}
                      {campaign.frequency === 'on-completion' && '✓ Sent on course completion'}
                      {campaign.frequency === 'weekly' && '📅 Sent weekly'}
                      {campaign.frequency === 'on-signup' && '🎉 Sent on signup'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === 'active' && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-5 gap-4">
                  {/* Sent */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Send className="w-4 h-4 text-[#ff6633]" />
                      <span className="text-sm font-medium text-gray-600">Sent</span>
                    </div>
                    <div className="text-2xl font-bold text-[#1a4d4d]">{campaign.sent}</div>
                  </div>

                  {/* Opened */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-600">Opened</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{campaign.opened}</div>
                    <p className="text-xs text-gray-500">{metrics.openRate}% rate</p>
                  </div>

                  {/* Clicked */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-600">Clicked</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{campaign.clicked}</div>
                    <p className="text-xs text-gray-500">{metrics.clickRate}% of opens</p>
                  </div>

                  {/* Converted */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-600">Converted</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{campaign.converted}</div>
                    <p className="text-xs text-gray-500">{metrics.conversionRate}% rate</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" className="border-[#ff6633] text-[#ff6633] hover:bg-[#ff6633]/10">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-300">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Campaign Strategy */}
      <Card className="bg-gradient-to-r from-[#1a4d4d]/5 to-[#ff6633]/5 border-l-4 border-[#ff6633]">
        <CardHeader>
          <CardTitle className="text-[#1a4d4d] flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Campaign Strategy Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold text-[#1a4d4d] mb-1">Enrollment Confirmation</h4>
            <p className="text-sm text-gray-600">Send immediately upon enrollment to confirm course details and next steps. Current performance: {campaigns[0] && `${calculateMetrics(campaigns[0]).conversionRate}% conversion`}</p>
          </div>
          <div>
            <h4 className="font-semibold text-[#1a4d4d] mb-1">Course Completion</h4>
            <p className="text-sm text-gray-600">Send congratulations email with certificate link. Encourage social sharing and referrals. Current performance: {campaigns[1] && `${calculateMetrics(campaigns[1]).conversionRate}% conversion`}</p>
          </div>
          <div>
            <h4 className="font-semibold text-[#1a4d4d] mb-1">Churn Risk Alert</h4>
            <p className="text-sm text-gray-600">Send weekly alerts to inactive users with personalized re-engagement offers. Current performance: {campaigns[2] && `${calculateMetrics(campaigns[2]).conversionRate}% conversion`}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
