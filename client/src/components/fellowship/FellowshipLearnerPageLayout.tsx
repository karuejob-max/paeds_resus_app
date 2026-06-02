import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Award, ArrowLeft, HelpCircle } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { FELLOWSHIP_MISSION_TAGLINE } from "@shared/fellowship-learner-content";

type Props = {
  title: string;
  description: string;
  path: string;
  children: React.ReactNode;
  showWhyLink?: boolean;
};

export function FellowshipLearnerPageLayout({
  title,
  description,
  path,
  children,
  showWhyLink = true,
}: Props) {
  usePageMeta({ title, description, path });

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-teal/15 via-background to-card py-8 px-4 md:py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-3">
          <Link href="/fellowship">
            <Button variant="ghost" size="sm" className="-ml-2 gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Fellowship dashboard
            </Button>
          </Link>
          <p className="text-sm font-medium text-primary">{FELLOWSHIP_MISSION_TAGLINE}</p>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
            <Award className="h-8 w-8 text-primary shrink-0" />
            {title}
          </h1>
          <p className="text-muted-foreground text-lg">{description}</p>
        </div>

        {children}

        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <Link href="/fellowship">
            <Button variant="default">Open dashboard</Button>
          </Link>
          {showWhyLink && (
            <Link href="/fellowship/why">
              <Button variant="outline" className="gap-1.5">
                <HelpCircle className="h-4 w-4" />
                Practitioner Q&amp;A
              </Button>
            </Link>
          )}
          <Link href="/fellowship/about">
            <Button variant="outline">Fellowship guide</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
