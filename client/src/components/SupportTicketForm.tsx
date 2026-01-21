import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle } from "lucide-react";

export function SupportTicketForm() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"technical" | "billing" | "enrollment" | "certificate" | "payment" | "other">("technical");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");

  const createTicket = trpc.support.createTicket.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createTicket.mutateAsync({
        subject,
        description,
        category,
        priority,
      });
      setTicketNumber(result.ticketNumber);
      setSubmitted(true);
      setSubject("");
      setDescription("");
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      alert("Failed to create ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-green-900">Ticket Created Successfully</h3>
            <p className="text-sm text-green-700 mt-1">
              Ticket #{ticketNumber} has been created. We'll get back to you soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Subject */}
      <div>
        <label className="block text-sm font-medium mb-1">Subject *</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief description of your issue"
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="technical">Technical Issue</option>
          <option value="billing">Billing</option>
          <option value="enrollment">Enrollment</option>
          <option value="certificate">Certificate</option>
          <option value="payment">Payment</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium mb-1">Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">Description *</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide detailed information about your issue..."
          rows={5}
          required
        />
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex gap-2">
        <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-blue-700">
          We typically respond to support tickets within 24 hours.
        </p>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Creating Ticket..." : "Create Support Ticket"}
      </Button>
    </form>
  );
}
