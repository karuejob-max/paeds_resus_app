import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export default function WhatsAppButton({
  phoneNumber = "254706781260",
  message = "Hello Paeds Resus, I would like to inquire about your training programs.",
  variant = "default",
  size = "default",
  className = "",
  showIcon = true,
  label = "Chat on WhatsApp",
}: WhatsAppButtonProps) {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
      <Button
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
      >
        {showIcon && <MessageCircle className="w-4 h-4" />}
        {label}
      </Button>
    </a>
  );
}

/**
 * Floating WhatsApp Button Component
 * Fixed position button for quick access
 */
export function FloatingWhatsAppButton({
  phoneNumber = "254706781260",
  message = "Hello Paeds Resus, I would like to inquire about your training programs.",
}: {
  phoneNumber?: string;
  message?: string;
}) {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 group"
      title="Chat with us on WhatsApp"
    >
      <div className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-110 flex items-center justify-center">
        <MessageCircle className="w-6 h-6" />
      </div>
      <div className="absolute bottom-16 right-0 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        Chat with us on WhatsApp
      </div>
    </a>
  );
}
