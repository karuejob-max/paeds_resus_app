import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

export default function SuccessStories() {
  const [likedStories, setLikedStories] = useState<number[]>([]);

  const stories = [
    {
      id: 1,
      title: "How Paeds Resus Training Saved a Child's Life in Rural Kenya",
      author: "Dr. Amina Hassan",
      role: "Pediatrician, Kisumu County Hospital",
      date: "January 15, 2026",
      category: "Clinical Impact",
      excerpt:
        "After completing the Elite Fellowship program, I was able to recognize and treat a case of severe septic shock in a 4-year-old child. The training gave me the confidence and skills to act quickly.",
      content:
        "After completing the Elite Fellowship program, I was able to recognize and treat a case of severe septic shock in a 4-year-old child. The training gave me the confidence and skills to act quickly. The child, who would have likely not survived without proper intervention, is now healthy and back in school. This is why I believe in the mission of Paeds Resus.",
      image: "👩‍⚕️",
      likes: 234,
      comments: 18,
      shares: 45,
    },
    {
      id: 2,
      title: "From Uncertainty to Confidence: My Paeds Resus Journey",
      author: "James Kiplagat",
      role: "Nurse, Nairobi General Hospital",
      date: "January 10, 2026",
      category: "Personal Growth",
      excerpt:
        "I was always nervous about handling pediatric emergencies. The Paeds Resus training completely transformed my approach to patient care and gave me the confidence I needed.",
      content:
        "I was always nervous about handling pediatric emergencies. The Paeds Resus training completely transformed my approach to patient care and gave me the confidence I needed. The instructors were incredibly supportive, and the practical sessions were invaluable. I now feel equipped to handle any pediatric emergency that comes my way.",
      image: "👨‍⚕️",
      likes: 189,
      comments: 12,
      shares: 32,
    },
    {
      id: 3,
      title: "Institutional Success: How Mombasa Hospital Improved Outcomes",
      author: "Dr. Sarah Mwangi",
      role: "Medical Director, Mombasa Referral Hospital",
      date: "January 5, 2026",
      category: "Institutional Impact",
      excerpt:
        "After training 50 staff members through Paeds Resus, our pediatric mortality rate decreased by 23%. The investment in training has been transformative for our institution.",
      content:
        "After training 50 staff members through Paeds Resus, our pediatric mortality rate decreased by 23%. The investment in training has been transformative for our institution. The Safe-Truth tool helped us identify gaps in our safety culture, and the training addressed those gaps systematically. We've seen improvements not just in outcomes but also in staff morale and confidence.",
      image: "👩‍⚕️",
      likes: 456,
      comments: 34,
      shares: 78,
    },
    {
      id: 4,
      title: "Breaking Barriers: Bringing Quality Training to Remote Areas",
      author: "Peter Omondi",
      role: "Health Officer, Turkana County",
      date: "December 28, 2025",
      category: "Access & Equity",
      excerpt:
        "The online platform made it possible for healthcare workers in remote areas to access world-class training. This is a game-changer for rural healthcare delivery.",
      content:
        "The online platform made it possible for healthcare workers in remote areas to access world-class training. This is a game-changer for rural healthcare delivery. Previously, we had to travel to Nairobi for training, which was costly and time-consuming. Now, our team can learn at their own pace and still provide excellent care to our community.",
      image: "👨‍⚕️",
      likes: 312,
      comments: 25,
      shares: 56,
    },
    {
      id: 5,
      title: "Certification Success: 98% Pass Rate in Latest Cohort",
      author: "Paeds Resus Team",
      role: "Training Department",
      date: "December 20, 2025",
      category: "Program Updates",
      excerpt:
        "Our latest cohort achieved a 98% certification pass rate, with participants praising the quality of instruction and comprehensive curriculum.",
      content:
        "Our latest cohort achieved a 98% certification pass rate, with participants praising the quality of instruction and comprehensive curriculum. This success is a testament to the dedication of our instructors and the commitment of our learners. We're proud to be producing highly skilled pediatric emergency care professionals.",
      image: "🎓",
      likes: 278,
      comments: 16,
      shares: 42,
    },
    {
      id: 6,
      title: "Mentorship Impact: Paying It Forward in Pediatric Care",
      author: "Dr. Elizabeth Kipchoge",
      role: "Elite Fellow & Mentor",
      date: "December 15, 2025",
      category: "Community",
      excerpt:
        "As an Elite Fellow, I've had the opportunity to mentor junior healthcare workers. Seeing them grow and develop confidence has been incredibly rewarding.",
      content:
        "As an Elite Fellow, I've had the opportunity to mentor junior healthcare workers. Seeing them grow and develop confidence has been incredibly rewarding. The mentorship component of the program has created a ripple effect of knowledge and skills spreading through our healthcare system. This is how we create lasting change.",
      image: "👩‍⚕️",
      likes: 201,
      comments: 14,
      shares: 38,
    },
  ];

  const toggleLike = (id: number) => {
    setLikedStories((prev) =>
      prev.includes(id) ? prev.filter((storyId) => storyId !== id) : [...prev, id]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Clinical Impact":
        return "bg-red-100 text-red-800";
      case "Personal Growth":
        return "bg-blue-100 text-blue-800";
      case "Institutional Impact":
        return "bg-green-100 text-green-800";
      case "Access & Equity":
        return "bg-purple-100 text-purple-800";
      case "Program Updates":
        return "bg-yellow-100 text-yellow-800";
      case "Community":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Impact Stories
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Success Stories
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Real stories from healthcare professionals whose lives have been transformed by Paeds Resus training
          </p>
        </div>
      </section>

      {/* Stories Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {stories.map((story) => (
            <Card key={story.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0 text-5xl">{story.image}</div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {story.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={getCategoryColor(story.category)}>
                            {story.category}
                          </Badge>
                          <span className="text-sm text-gray-500">{story.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="font-semibold text-gray-900">{story.author}</p>
                      <p className="text-sm text-gray-600">{story.role}</p>
                    </div>

                    <p className="text-gray-700 mb-6 leading-relaxed">
                      {story.content}
                    </p>

                    {/* Engagement Metrics */}
                    <div className="flex items-center gap-6 pt-4 border-t">
                      <button
                        onClick={() => toggleLike(story.id)}
                        className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            likedStories.includes(story.id)
                              ? "fill-red-600 text-red-600"
                              : ""
                          }`}
                        />
                        <span className="text-sm">
                          {story.likes + (likedStories.includes(story.id) ? 1 : 0)}
                        </span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">{story.comments}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors">
                        <Share2 className="w-5 h-5" />
                        <span className="text-sm">{story.shares}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Share Your Story</h2>
          <p className="text-xl text-gray-600 mb-8">
            Have you been impacted by Paeds Resus training? We'd love to hear your story
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Submit Your Story
          </Button>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Impact by Numbers</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">5,000+</div>
                <p className="text-gray-600">Healthcare Providers Trained</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-green-600 mb-2">50,000+</div>
                <p className="text-gray-600">Children Impacted</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-purple-600 mb-2">98%</div>
                <p className="text-gray-600">Satisfaction Rate</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-orange-600 mb-2">23%</div>
                <p className="text-gray-600">Average Mortality Reduction</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
