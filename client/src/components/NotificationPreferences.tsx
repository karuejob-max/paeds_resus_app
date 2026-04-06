/**
 * Notification Preferences UI
 * 
 * Allows facility admins to configure:
 * - Alert channels (email, in-app, SMS)
 * - Frequency thresholds (training gaps, engagement drops)
 * - Time windows (quiet hours, optimal delivery times)
 * 
 * Strategic alignment: Institutional partnership + feedback loops
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Mail, MessageSquare, Phone, Clock, AlertTriangle, TrendingDown } from 'lucide-react';

interface NotificationPreference {
  channelEmail: boolean;
  channelInApp: boolean;
  channelSMS: boolean;
  trainingGapThreshold: number; // days without practice
  engagementDropThreshold: number; // % decrease
  quietHoursStart: string; // HH:MM
  quietHoursEnd: string; // HH:MM
  timezone: string;
  streakMilestoneNotifications: boolean;
  criticalGapAlerts: boolean;
  weeklyDigest: boolean;
}

export function NotificationPreferences({ institutionId }: { institutionId: number }) {
  const [preferences, setPreferences] = useState<NotificationPreference>({
    channelEmail: true,
    channelInApp: true,
    channelSMS: false,
    trainingGapThreshold: 30,
    engagementDropThreshold: 25,
    quietHoursStart: '22:00',
    quietHoursEnd: '06:00',
    timezone: 'EAT',
    streakMilestoneNotifications: true,
    criticalGapAlerts: true,
    weeklyDigest: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  // Fetch current preferences
  const { data: currentPrefs } = trpc.adminNotifications.getPreferences.useQuery({
    institutionId,
  });

  // Save preferences mutation
  const savePreferences = trpc.adminNotifications.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success('Notification preferences saved');
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error('Failed to save preferences');
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    savePreferences.mutate({
      institutionId,
      preferences,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Configure how and when you receive alerts about staff engagement, training gaps, and milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="channels" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            {/* Channels Tab */}
            <TabsContent value="channels" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="email"
                    checked={preferences.channelEmail}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, channelEmail: checked as boolean })
                    }
                  />
                  <Label htmlFor="email" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Email</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Receive alerts via email</p>
                  </Label>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="inapp"
                    checked={preferences.channelInApp}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, channelInApp: checked as boolean })
                    }
                  />
                  <Label htmlFor="inapp" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      <span className="font-medium">In-App</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">See alerts in your dashboard</p>
                  </Label>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="sms"
                    checked={preferences.channelSMS}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, channelSMS: checked as boolean })
                    }
                  />
                  <Label htmlFor="sms" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">SMS</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Receive critical alerts via SMS (charges may apply)</p>
                  </Label>
                </div>
              </div>

              <div className="space-y-3 mt-6 pt-6 border-t">
                <h4 className="font-semibold text-sm">Alert Types</h4>

                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="streak"
                    checked={preferences.streakMilestoneNotifications}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, streakMilestoneNotifications: checked as boolean })
                    }
                  />
                  <Label htmlFor="streak" className="flex-1 cursor-pointer">
                    <span className="font-medium">Streak Milestones</span>
                    <p className="text-xs text-gray-600 mt-1">Celebrate staff reaching 7, 14, 30-day streaks</p>
                  </Label>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="critical"
                    checked={preferences.criticalGapAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, criticalGapAlerts: checked as boolean })
                    }
                  />
                  <Label htmlFor="critical" className="flex-1 cursor-pointer">
                    <span className="font-medium">Critical Training Gaps</span>
                    <p className="text-xs text-gray-600 mt-1">Alert when critical conditions aren't practiced</p>
                  </Label>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="digest"
                    checked={preferences.weeklyDigest}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, weeklyDigest: checked as boolean })
                    }
                  />
                  <Label htmlFor="digest" className="flex-1 cursor-pointer">
                    <span className="font-medium">Weekly Digest</span>
                    <p className="text-xs text-gray-600 mt-1">Summary of facility engagement and progress</p>
                  </Label>
                </div>
              </div>
            </TabsContent>

            {/* Thresholds Tab */}
            <TabsContent value="thresholds" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    Training Gap Threshold
                  </Label>
                  <p className="text-xs text-gray-600 mb-2">
                    Alert when a condition hasn't been practiced for:
                  </p>
                  <div className="flex items-center gap-2">
                    <Select
                      value={preferences.trainingGapThreshold.toString()}
                      onValueChange={(val) =>
                        setPreferences({ ...preferences, trainingGapThreshold: parseInt(val) })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    Engagement Drop Threshold
                  </Label>
                  <p className="text-xs text-gray-600 mb-2">
                    Alert when facility engagement drops by:
                  </p>
                  <div className="flex items-center gap-2">
                    <Select
                      value={preferences.engagementDropThreshold.toString()}
                      onValueChange={(val) =>
                        setPreferences({ ...preferences, engagementDropThreshold: parseInt(val) })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="25">25%</SelectItem>
                        <SelectItem value="50">50%</SelectItem>
                        <SelectItem value="75">75%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Timezone
                  </Label>
                  <Select value={preferences.timezone} onValueChange={(val) => setPreferences({ ...preferences, timezone: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EAT">East Africa Time (EAT)</SelectItem>
                      <SelectItem value="CAT">Central Africa Time (CAT)</SelectItem>
                      <SelectItem value="WAT">West Africa Time (WAT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Quiet Hours (no alerts during this time)</Label>
                  <div className="flex items-center gap-2">
                    <Select value={preferences.quietHoursStart} onValueChange={(val) => setPreferences({ ...preferences, quietHoursStart: val })}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                            {`${i.toString().padStart(2, '0')}:00`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-600">to</span>
                    <Select value={preferences.quietHoursEnd} onValueChange={(val) => setPreferences({ ...preferences, quietHoursEnd: val })}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                            {`${i.toString().padStart(2, '0')}:00`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
