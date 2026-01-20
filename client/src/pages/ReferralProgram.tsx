import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Share2, Gift, TrendingUp, Users } from "lucide-react";

export default function ReferralProgram() {
  const [copiedCode, setCopiedCode] = useState(false);
  const referralCode = "JANE2026";
  const referralLink = `https://paedsresus.com?ref=${referralCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const referralStats = {
    totalReferrals: 12,
    successfulReferrals: 8,
    pendingReferrals: 4,
    totalEarnings: 480000,
    availableRewards: 120000,
  };

  const referrals = [
    {
      id: 1,
      name: "Peter Omondi",
      email: "peter@example.com",
      status: "Completed",
      date: "Jan 20, 2026",
      reward: 60000,
    },
    {
      id: 2,
      name: "Grace Kipchoge",
      email: "grace@example.com",
      status: "Completed",
      date: "Jan 18, 2026",
      reward: 60000,
    },
    {
      id: 3,
      name: "Michael Kiplagat",
      email: "michael@example.com",
      status: "Completed",
      date: "Jan 15, 2026",
      reward: 60000,
    },
    {
      id: 4,
      name: "Amina Hassan",
      email: "amina@example.com",
      status: "In Progress",
      date: "Jan 22, 2026",
      reward: 0,
    },
  ];

  const rewards = [
    {
      tier: "Bronze",
      referrals: "1-5",
      reward: "60,000 KES per referral",
      bonus: "10% bonus on all referrals",
      badge: "🥉",
    },
    {
      tier: "Silver",
      referrals: "6-15",
      reward: "75,000 KES per referral",
      bonus: "15% bonus + exclusive perks",
      badge: "🥈",
    },
    {
      tier: "Gold",
      referrals: "16-30",
      reward: "90,000 KES per referral",
      bonus: "20% bonus + VIP support",
      badge: "🥇",
    },
    {
      tier: "Platinum",
      referrals: "30+",
      reward: "120,000 KES per referral",
      bonus: "25% bonus + partnership opportunities",
      badge: "💎",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Earn Rewards
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Referral Program
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Share Paeds Resus with colleagues and earn generous rewards
          </p>
        </div>
      </section>

      {/* Your Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <Users className="w-8 h-8 text-blue-600 mb-3" />
                <p className="text-sm text-gray-600 mb-2">Total Referrals</p>
                <p className="text-3xl font-bold text-gray-900">
                  {referralStats.totalReferrals}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
                <p className="text-sm text-gray-600 mb-2">Successful</p>
                <p className="text-3xl font-bold text-gray-900">
                  {referralStats.successfulReferrals}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Gift className="w-8 h-8 text-purple-600 mb-3" />
                <p className="text-sm text-gray-600 mb-2">Total Earned</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(referralStats.totalEarnings / 1000).toFixed(0)}K
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Gift className="w-8 h-8 text-orange-600 mb-3" />
                <p className="text-sm text-gray-600 mb-2">Available</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(referralStats.availableRewards / 1000).toFixed(0)}K
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Badge className="bg-blue-100 text-blue-800 mb-3">
                  Silver
                </Badge>
                <p className="text-sm text-gray-600 mb-2">Your Tier</p>
                <p className="text-sm font-semibold text-gray-900">
                  6/15 referrals
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Referral Code */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Share Your Referral Code</h2>
          <Card className="border-2 border-blue-600 bg-blue-50">
            <CardContent className="pt-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Your Referral Code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={referralCode}
                      readOnly
                      className="text-lg font-mono font-bold"
                    />
                    <Button
                      onClick={() => copyToClipboard(referralCode)}
                      variant="outline"
                    >
                      {copiedCode ? "Copied!" : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Your Referral Link
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={referralLink}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      onClick={() => copyToClipboard(referralLink)}
                      variant="outline"
                    >
                      {copiedCode ? "Copied!" : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share on WhatsApp
                  </Button>
                  <Button variant="outline" size="lg">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share on Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Reward Tiers */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Reward Tiers</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {rewards.map((reward) => (
              <Card
                key={reward.tier}
                className={`${
                  reward.tier === "Silver"
                    ? "border-2 border-blue-600 ring-2 ring-blue-200"
                    : ""
                }`}
              >
                <CardContent className="pt-6">
                  <div className="text-4xl mb-3">{reward.badge}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {reward.tier}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {reward.referrals} referrals
                  </p>
                  <div className="space-y-3 border-t pt-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        Per Referral
                      </p>
                      <p className="font-bold text-gray-900">
                        {reward.reward}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Bonus</p>
                      <p className="font-bold text-green-600">
                        {reward.bonus}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Referrals */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Your Referrals</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Reward
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((referral) => (
                      <tr key={referral.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">
                          {referral.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {referral.email}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              referral.status === "Completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            {referral.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {referral.date}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">
                          {referral.reward > 0
                            ? `+${(referral.reward / 1000).toFixed(0)}K KES`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          <div className="space-y-6">
            {[
              {
                step: 1,
                title: "Share Your Code",
                description: "Share your unique referral code with colleagues via email, WhatsApp, or social media",
              },
              {
                step: 2,
                title: "They Enroll",
                description: "Your colleague enrolls using your referral code or link",
              },
              {
                step: 3,
                title: "They Complete",
                description: "Once they complete their enrollment and first payment, the referral is confirmed",
              },
              {
                step: 4,
                title: "You Earn",
                description: "Receive your reward immediately in your account",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white font-bold">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">FAQs</h2>
          <div className="space-y-4">
            {[
              {
                q: "How much can I earn?",
                a: "You can earn up to 120,000 KES per successful referral at the Platinum tier, plus bonuses based on your tier level.",
              },
              {
                q: "When do I get paid?",
                a: "Rewards are credited to your account immediately after your referral completes their enrollment and payment.",
              },
              {
                q: "Is there a limit to referrals?",
                a: "No limit! You can refer as many people as you want and earn rewards for each successful referral.",
              },
              {
                q: "Can I withdraw my earnings?",
                a: "Yes, you can withdraw your earnings via M-Pesa, bank transfer, or use them as credit for future enrollments.",
              },
            ].map((faq, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
