import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Send, CheckCircle2, Clock } from "lucide-react";

export default function Referral() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    patientAge: 0,
    diagnosis: "",
    urgency: "routine" as const,
    reason: "",
    referralType: "hospital" as const,
    facilityName: "",
    notes: "",
  });

  // TODO: Implement getReferrals query
  const referralsQuery = { data: [], isLoading: false };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading referrals...</p>
        </div>
      </div>
    );
  }

  const referrals = referralsQuery.data || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement referral submission
    setShowForm(false);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return "destructive";
      case "urgent":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "accepted") return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (status === "pending") return <Clock className="w-5 h-5 text-yellow-600" />;
    return <AlertCircle className="w-5 h-5 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Referrals</h1>
              <p className="text-gray-600 mt-2">Manage patient referrals to other facilities</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Send className="w-4 h-4" />
              New Referral
            </Button>
          </div>

          {/* Referral Form */}
          {showForm && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle>Create New Referral</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patientName">Patient Name</Label>
                      <Input
                        id="patientName"
                        name="patientName"
                        value={formData.patientName}
                        onChange={handleInputChange}
                        placeholder="Patient name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="patientAge">Patient Age</Label>
                      <Input
                        id="patientAge"
                        name="patientAge"
                        type="number"
                        value={formData.patientAge}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="diagnosis">Diagnosis</Label>
                      <Input
                        id="diagnosis"
                        name="diagnosis"
                        value={formData.diagnosis}
                        onChange={handleInputChange}
                        placeholder="Primary diagnosis"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="urgency">Urgency</Label>
                      <Select value={formData.urgency} onValueChange={(value) => handleSelectChange("urgency", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="routine">Routine</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="referralType">Referral Type</Label>
                      <Select value={formData.referralType} onValueChange={(value) => handleSelectChange("referralType", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hospital">Hospital</SelectItem>
                          <SelectItem value="specialist">Specialist</SelectItem>
                          <SelectItem value="imaging">Imaging Center</SelectItem>
                          <SelectItem value="lab">Laboratory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facilityName">Facility Name</Label>
                      <Input
                        id="facilityName"
                        name="facilityName"
                        value={formData.facilityName}
                        onChange={handleInputChange}
                        placeholder="Target facility"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Referral</Label>
                    <Textarea
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      placeholder="Explain why this patient needs referral"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any additional information"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit">Send Referral</Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Referrals List */}
        {referrals.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No referrals yet. Create your first referral to get started.</p>
              <Button onClick={() => setShowForm(true)}>Create Referral</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {referrals.map((referral: any) => (
              <Card key={referral.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{referral.patientName}</h3>
                        <Badge variant={getUrgencyColor(referral.urgency)}>
                          {referral.urgency.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{referral.diagnosis}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(referral.status)}
                      <span className="text-sm font-medium capitalize">{referral.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Age</p>
                      <p className="text-sm font-semibold">{referral.patientAge} years</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Type</p>
                      <p className="text-sm font-semibold capitalize">{referral.referralType}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Facility</p>
                      <p className="text-sm font-semibold">{referral.facilityName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Date</p>
                      <p className="text-sm font-semibold">{new Date(referral.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {referral.notes && (
                    <div className="p-3 bg-gray-50 rounded-lg mb-4">
                      <p className="text-sm text-gray-700">{referral.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    {referral.status === "pending" && (
                      <Button size="sm" variant="outline">
                        Cancel Referral
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
