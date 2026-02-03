import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, CheckCircle } from "lucide-react";

interface LeadFormData {
  institutionName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  staffCount: number;
  preferredCourse: string;
  message: string;
}

export function InstitutionalLeadForm() {
  const [formData, setFormData] = useState<LeadFormData>({
    institutionName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    staffCount: 0,
    preferredCourse: "BLS",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const courses = [
    { id: "BLS", name: "BLS (10,000 KES)", price: 10000 },
    { id: "ACLS", name: "ACLS (20,000 KES)", price: 20000 },
    { id: "PALS", name: "PALS (20,000 KES)", price: 20000 },
    { id: "Bronze", name: "Bronze Fellowship (70,000 KES)", price: 70000 },
    { id: "Silver", name: "Silver Fellowship (100,000 KES)", price: 100000 },
    { id: "Gold", name: "Gold Fellowship (150,000 KES)", price: 150000 },
  ];

  const selectedCourse = courses.find((c) => c.id === formData.preferredCourse);
  const estimatedTotal = selectedCourse ? selectedCourse.price * formData.staffCount : 0;
  const bulkDiscount = formData.staffCount >= 200 ? 0.4 : formData.staffCount >= 100 ? 0.3 : formData.staffCount >= 50 ? 0.2 : formData.staffCount >= 20 ? 0.1 : 0;
  const discountedTotal = estimatedTotal * (1 - bulkDiscount);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "staffCount" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate WhatsApp message with quote
      const whatsappMessage = `Hi ResusGPS,\n\nI'm interested in ${formData.preferredCourse} training for our institution.\n\nInstitution: ${formData.institutionName}\nStaff Count: ${formData.staffCount}\nEstimated Cost: ${discountedTotal.toLocaleString()} KES\n\nPlease contact me at ${formData.contactPhone} or ${formData.contactEmail}.\n\nThank you,\n${formData.contactName}`;

      // Open WhatsApp with pre-filled message
      const whatsappUrl = `https://wa.me/254706781260?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappUrl, "_blank");

      // Mark as submitted
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          institutionName: "",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
          staffCount: 0,
          preferredCourse: "BLS",
          message: "",
        });
      }, 3000);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-8 text-center bg-green-50 border-green-200">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">Quote Request Sent!</h3>
        <p className="text-green-700">
          Our sales team will contact you shortly via WhatsApp and email with a personalized quote.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-8 bg-white">
      <h2 className="text-2xl font-bold mb-6">Get a Personalized Quote</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Institution Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Institution Name *
            </label>
            <Input
              type="text"
              name="institutionName"
              value={formData.institutionName}
              onChange={handleChange}
              placeholder="e.g., Kenyatta National Hospital"
              required
              className="w-full"
            />
          </div>

          {/* Contact Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name *
            </label>
            <Input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              placeholder="Full name"
              required
              className="w-full"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <Input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="w-full"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <Input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="+254 7XX XXX XXX"
              required
              className="w-full"
            />
          </div>

          {/* Staff Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Staff to Train *
            </label>
            <Input
              type="number"
              name="staffCount"
              value={formData.staffCount}
              onChange={handleChange}
              placeholder="e.g., 50"
              required
              min="1"
              className="w-full"
            />
          </div>

          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Course *
            </label>
            <select
              name="preferredCourse"
              value={formData.preferredCourse}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Calculation */}
        {formData.staffCount > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Pricing Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Price per Person:</span>
                <span className="font-medium">{selectedCourse?.price.toLocaleString()} KES</span>
              </div>
              <div className="flex justify-between">
                <span>Number of Staff:</span>
                <span className="font-medium">{formData.staffCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{estimatedTotal.toLocaleString()} KES</span>
              </div>
              {bulkDiscount > 0 && (
                <>
                  <div className="flex justify-between text-green-700">
                    <span>Bulk Discount ({Math.round(bulkDiscount * 100)}%):</span>
                    <span className="font-medium">
                      -{(estimatedTotal * bulkDiscount).toLocaleString()} KES
                    </span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-blue-900">
                    <span>Total Cost:</span>
                    <span>{discountedTotal.toLocaleString()} KES</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Additional Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Information (Optional)
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Tell us about your specific needs or questions..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !formData.institutionName || !formData.contactName || !formData.contactEmail || !formData.contactPhone || formData.staffCount === 0}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          {loading ? "Sending..." : "Get Quote via WhatsApp"}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Clicking this button will open WhatsApp with your quote details. Our sales team will respond within 24 hours.
        </p>
      </form>
    </Card>
  );
}
