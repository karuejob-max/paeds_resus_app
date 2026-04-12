import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/home")}
          className="flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </div>
      <div className="max-w-3xl mx-auto prose prose-slate">
        <h1>Privacy policy</h1>
        <p className="text-muted-foreground">
          Paeds Resus handles account, training, payment, and usage data to run the platform. We use payment providers
          as needed. Contact us for access or correction requests where applicable.
        </p>
        <h2>Contact</h2>
        <p>
          <a href="mailto:support@paeds-resus.com" className="text-primary underline">
            support@paeds-resus.com
          </a>
        </p>
        <p>
          <Link href="/help" className="underline">
            Help Centre
          </Link>
        </p>
      </div>
    </div>
  );
}
