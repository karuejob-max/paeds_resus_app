import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Plus, Trash2, Heart } from "lucide-react";

interface TimelineEvent {
  id: string;
  eventType: string;
  time: string;
  description: string;
}

export default function ParentSafeTruth() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [childOutcome, setChildOutcome] = useState<"discharged" | "referred" | "passed-away" | null>(null);
  const [currentEvent, setCurrentEvent] = useState({
    eventType: "arrival",
    time: "",
    description: "",
  });

  const eventTypes = [
    { value: "arrival", label: "Arrived at Hospital" },
    { value: "symptoms", label: "Symptoms Observed" },
    { value: "doctor-seen", label: "Seen by Doctor" },
    { value: "intervention", label: "Intervention Started" },
    { value: "oxygen", label: "Oxygen Started" },
    { value: "communication", label: "Staff Communication" },
    { value: "fluids", label: "Fluids Given" },
    { value: "concern-raised", label: "Concern Raised" },
    { value: "monitoring", label: "Monitoring" },
    { value: "medication", label: "Medication Given" },
    { value: "referral-decision", label: "Referral Decision Made" },
    { value: "referral-organized", label: "Referral Organized" },
    { value: "transferred", label: "Transferred to Facility" },
    { value: "update", label: "Update Received" },
  ];

  const addEvent = () => {
    if (currentEvent.time && currentEvent.description) {
      const newEvent: TimelineEvent = {
        id: Date.now().toString(),
        eventType: currentEvent.eventType,
        time: currentEvent.time,
        description: currentEvent.description,
      };
      setEvents([...events, newEvent]);
      setCurrentEvent({ eventType: "arrival", time: "", description: "" });
    }
  };

  const removeEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  const handleSubmit = async () => {
    // TODO: Submit to tRPC endpoint
    console.log("Submitting parent Safe-Truth:", {
      events,
      childOutcome,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <Heart className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Share Your Child's Healthcare Journey</h1>
          <p className="text-lg text-gray-600">
            Help us understand your experience and improve hospital care for all children
          </p>
        </div>

        {/* Child Outcome Selection */}
        <Card className="mb-8 border-2 border-red-200">
          <CardHeader>
            <CardTitle>Your Child's Outcome</CardTitle>
            <CardDescription>This helps us understand the context of your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: "discharged", label: "Discharged Home", color: "green" },
                { value: "referred", label: "Referred to Another Facility", color: "yellow" },
                { value: "passed-away", label: "Child Passed Away", color: "red" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setChildOutcome(option.value as any)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    childOutcome === option.value
                      ? `border-${option.color}-600 bg-${option.color}-50`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-semibold text-gray-900">{option.label}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline Events */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Timeline of Events</CardTitle>
            <CardDescription>Document what happened and when, in chronological order</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add Event Form */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <h3 className="font-semibold text-gray-900 mb-4">Add Event</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                  <select
                    value={currentEvent.eventType}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, eventType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {eventTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <Input
                    type="datetime-local"
                    value={currentEvent.time}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, time: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">What Happened?</label>
                  <Textarea
                    value={currentEvent.description}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, description: e.target.value })}
                    placeholder="Describe what happened at this time..."
                    className="w-full"
                    rows={3}
                  />
                </div>

                <Button onClick={addEvent} className="w-full bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </div>
            </div>

            {/* Events Timeline */}
            {events.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Your Timeline</h3>
                {events
                  .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
                  .map((event, index) => {
                    const eventType = eventTypes.find((t) => t.value === event.eventType);
                    return (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <Clock className="w-5 h-5 text-red-600" />
                          {index < events.length - 1 && <div className="w-0.5 h-12 bg-red-200 my-2" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">{eventType?.label}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(event.time).toLocaleString()}
                                </p>
                              </div>
                              <button
                                onClick={() => removeEvent(event.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-gray-700">{event.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Section */}
        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={events.length === 0 || !childOutcome}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3"
          >
            Submit Your Story
          </Button>
          <Button variant="outline" className="flex-1">
            Save as Draft
          </Button>
        </div>

        {/* Info Box */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>Privacy Notice:</strong> Your story is confidential and will only be used to improve
              hospital care. You can choose to remain anonymous or share your name.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
