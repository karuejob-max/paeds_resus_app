import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * HEALTHCARE WORKER APP
 * 
 * Everything else is noise.
 * 
 * This is the entire app:
 * 1. Learn - Access all courses
 * 2. Refer - Share with colleagues
 * 3. Earn - See money coming in
 * 4. Impact - See lives saved
 * 
 * That's it.
 */

export default function HealthcareWorkerApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('learn');

  if (!user) {
    return <RegisterPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">ResusGPS</h1>
            <p className="text-sm text-gray-600">Save children's lives</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="learn">Learn</TabsTrigger>
            <TabsTrigger value="refer">Refer</TabsTrigger>
            <TabsTrigger value="earn">Earn</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
          </TabsList>

          {/* LEARN TAB */}
          <TabsContent value="learn" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">BLS Fundamentals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">40 hours • 40 lessons</p>
                  <p className="text-sm text-gray-700 mb-6">Master basic life support for children</p>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Learning</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">ACLS Advanced</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">60 hours • 60 lessons</p>
                  <p className="text-sm text-gray-700 mb-6">Advanced cardiovascular life support</p>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Learning</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">PALS Pediatric</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">80 hours • 80 lessons</p>
                  <p className="text-sm text-gray-700 mb-6">Pediatric advanced life support</p>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Learning</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Fellowship Elite</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">200 hours • 150 lessons</p>
                  <p className="text-sm text-gray-700 mb-6">Elite clinical training program</p>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Learning</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* REFER TAB */}
          <TabsContent value="refer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Share Your Referral Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-gray-700 mb-4">Earn $10 for every colleague who joins with your code</p>
                  <div className="bg-gray-100 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 mb-2">Your Referral Code:</p>
                    <p className="text-2xl font-bold text-blue-900">REF-ABC123</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="font-semibold text-gray-900">Share on:</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Button variant="outline" className="w-full">WhatsApp</Button>
                    <Button variant="outline" className="w-full">SMS</Button>
                    <Button variant="outline" className="w-full">Email</Button>
                    <Button variant="outline" className="w-full">Facebook</Button>
                    <Button variant="outline" className="w-full">Twitter</Button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Referral Message:</strong><br/>
                    "Join me on ResusGPS - I'm learning to save children's lives. Use code REF-ABC123 to get started instantly. No approvals needed."
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-900">42</p>
                    <p className="text-sm text-gray-600">Referrals Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">38</p>
                    <p className="text-sm text-gray-600">Converted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">$380</p>
                    <p className="text-sm text-gray-600">Earned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EARN TAB */}
          <TabsContent value="earn" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Earnings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Referral Earnings</p>
                    <p className="text-3xl font-bold text-blue-900">$380</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Teaching Earnings</p>
                    <p className="text-3xl font-bold text-green-900">$450</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Total Earnings</p>
                    <p className="text-3xl font-bold text-purple-900">$830</p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <p className="font-semibold text-gray-900 mb-4">Next Payout</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 mb-2">Amount: <strong>$830</strong></p>
                    <p className="text-gray-700 mb-2">Date: <strong>January 30, 2026</strong></p>
                    <p className="text-gray-700 mb-4">Method: <strong>M-Pesa</strong></p>
                    <Button className="w-full bg-green-600 hover:bg-green-700">Withdraw Now</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IMPACT TAB */}
          <TabsContent value="impact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-red-900">47</p>
                    <p className="text-sm text-gray-600">Lives Saved</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-orange-900">38</p>
                    <p className="text-sm text-gray-600">Deaths Avoided</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-yellow-900">94</p>
                    <p className="text-sm text-gray-600">Patients Improved</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-900">$4.7M</p>
                    <p className="text-sm text-gray-600">Value of Lives</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <p className="text-lg font-semibold text-blue-900 mb-2">
                    You've saved 47 children's lives.
                  </p>
                  <p className="text-gray-700">
                    That's 47 families who still have their child. That's 47 futures that exist because of you. This is why you're here.
                  </p>
                </div>

                <div className="border-t pt-6">
                  <p className="font-semibold text-gray-900 mb-4">Your Network Impact</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700">Direct Referrals</p>
                      <p className="font-bold text-gray-900">38</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700">Their Referrals</p>
                      <p className="font-bold text-gray-900">190</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700">Total Network</p>
                      <p className="font-bold text-gray-900">228</p>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <p className="text-gray-700 font-semibold">Lives Saved by Network</p>
                      <p className="font-bold text-green-600 text-lg">2,280</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * REGISTER PAGE
 * 30 seconds to start saving lives
 */
function RegisterPage() {
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    profession: 'nurse',
    country: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Register and redirect
    console.log('Registering:', formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">ResusGPS</CardTitle>
          <p className="text-center text-gray-600 text-sm mt-2">Save children's lives. Start in 30 seconds.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+254712345678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              >
                <option value="nurse">Nurse</option>
                <option value="doctor">Doctor</option>
                <option value="midwife">Midwife</option>
                <option value="community-health-worker">Community Health Worker</option>
                <option value="paramedic">Paramedic</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                placeholder="Kenya"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold">
              Start Learning Now
            </Button>

            <p className="text-center text-xs text-gray-600 mt-4">
              No approvals needed. No waiting. Start saving lives immediately.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
