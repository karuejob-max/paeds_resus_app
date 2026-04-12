import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Heart,
  AlertCircle,
  BookOpen,
  Phone,
  Shield,
  Users,
  Download,
  CheckCircle2,
} from "lucide-react";

export function ParentResources() {
  const resources = [
    {
      title: "Pediatric First Aid Basics",
      description: "Learn essential first aid skills for children and infants",
      icon: <Heart className="w-6 h-6" />,
      link: "/courses?category=first-aid",
      time: "20-30 min",
      level: "Beginner",
    },
    {
      title: "Emergency Response Guide",
      description: "Know what to do in common pediatric emergencies",
      icon: <AlertCircle className="w-6 h-6" />,
      link: "/parent-safe-truth",
      time: "15 min read",
      level: "Essential",
    },
    {
      title: "CPR for Parents",
      description: "Learn CPR techniques for children and infants",
      icon: <Heart className="w-6 h-6" />,
      link: "/courses?category=cpr",
      time: "30 min",
      level: "Intermediate",
    },
    {
      title: "Child Safety at Home",
      description: "Prevent common household injuries and accidents",
      icon: <Shield className="w-6 h-6" />,
      link: "/parent-safe-truth#home-safety",
      time: "20 min read",
      level: "Essential",
    },
    {
      title: "When to Call Emergency Services",
      description: "Understand warning signs and when to seek help",
      icon: <Phone className="w-6 h-6" />,
      link: "/parent-safe-truth#emergency-signs",
      time: "10 min read",
      level: "Essential",
    },
    {
      title: "Talking to Kids About Safety",
      description: "Age-appropriate conversations about staying safe",
      icon: <Users className="w-6 h-6" />,
      link: "/parent-safe-truth#talking-to-kids",
      time: "15 min read",
      level: "Beginner",
    },
  ];

  const quickLinks = [
    {
      title: "Emergency Numbers",
      description: "Quick access to emergency contacts",
      icon: <Phone className="w-5 h-5" />,
    },
    {
      title: "Downloadable Guides",
      description: "PDF guides for offline access",
      icon: <Download className="w-5 h-5" />,
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video demonstrations",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      title: "Community Support",
      description: "Connect with other parents",
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Parent & Caregiver Resources</h1>
        <p className="text-lg text-muted-foreground">
          Learn essential skills to keep your children safe and respond confidently in emergencies
        </p>
      </div>

      {/* Quick Start */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="font-semibold text-sm">Step 1: Learn Basics</p>
              <p className="text-sm text-muted-foreground">
                Start with our "Pediatric First Aid Basics" course (20-30 min)
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm">Step 2: Know the Signs</p>
              <p className="text-sm text-muted-foreground">
                Read the emergency response guide to recognize warning signs
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm">Step 3: Practice & Share</p>
              <p className="text-sm text-muted-foreground">
                Practice with family and download guides to share
              </p>
            </div>
          </div>
          <Link href="/courses?category=first-aid">
            <Button className="w-full">Start First Course</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Main Resources */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Featured Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <Link key={resource.link} href={resource.link}>
              <Card className="h-full hover:shadow-lg transition cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-primary">{resource.icon}</div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {resource.level}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">⏱️ {resource.time}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Card key={link.title} className="hover:shadow-lg transition cursor-pointer">
              <CardHeader className="space-y-2">
                <div className="text-primary">{link.icon}</div>
                <CardTitle className="text-sm">{link.title}</CardTitle>
                <CardDescription className="text-xs">{link.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-4 border-t pt-8">
        <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
        <div className="space-y-3">
          <details className="group border rounded-lg p-4 hover:bg-accent transition">
            <summary className="font-semibold cursor-pointer flex items-center justify-between">
              At what age can children learn first aid?
              <span className="group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="text-sm text-muted-foreground mt-2">
              Children as young as 5 can learn basic safety. Our courses are tailored for different
              age groups and parent comfort levels.
            </p>
          </details>

          <details className="group border rounded-lg p-4 hover:bg-accent transition">
            <summary className="font-semibold cursor-pointer flex items-center justify-between">
              How often should I refresh my first aid knowledge?
              <span className="group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="text-sm text-muted-foreground mt-2">
              We recommend refreshing your knowledge annually or after any significant life changes.
              Our courses are designed for quick updates.
            </p>
          </details>

          <details className="group border rounded-lg p-4 hover:bg-accent transition">
            <summary className="font-semibold cursor-pointer flex items-center justify-between">
              Can I download resources for offline use?
              <span className="group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="text-sm text-muted-foreground mt-2">
              Yes! All our guides are available as PDFs. Install the app for offline access to all
              resources.
            </p>
          </details>

          <details className="group border rounded-lg p-4 hover:bg-accent transition">
            <summary className="font-semibold cursor-pointer flex items-center justify-between">
              Is this a replacement for professional medical training?
              <span className="group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="text-sm text-muted-foreground mt-2">
              Our resources complement professional training but are not a replacement. Always seek
              professional medical help in emergencies.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
