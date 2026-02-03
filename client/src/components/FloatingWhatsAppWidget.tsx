import { MessageCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function FloatingWhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [location] = useLocation();

  // WhatsApp phone number and messages for different pages
  const getWhatsAppMessage = () => {
    const messages: Record<string, string> = {
      "/providers": "Hi! I'm interested in the Elite Fellowship program. Can you tell me more?",
      "/institutional": "Hello! We're interested in bulk training for our hospital staff. Can we discuss pricing?",
      "/parents": "Hi! I'd like to learn life-saving skills for my family. What courses do you offer?",
      "/about": "Hi! I'd like to know more about ResusGPS.",
      "/contact": "Hi! I have a question about your services.",
    };
    return messages[location] || "Hi! I'm interested in learning more about ResusGPS.";
  };

  const phoneNumber = "+254706781260";
  const message = encodeURIComponent(getWhatsAppMessage());
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  useEffect(() => {
    // Show widget after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#ff6633] text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center animate-bounce"
        title="Chat with us on WhatsApp"
        aria-label="Open WhatsApp chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Bubble */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 bg-white rounded-lg shadow-2xl p-4 w-80 animate-fadeIn">
          <div className="mb-4">
            <h3 className="font-bold text-[#1a4d4d] mb-2">Chat with ResusGPS</h3>
            <p className="text-sm text-gray-600">
              We're here to help! Send us a message on WhatsApp and we'll respond as soon as possible.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              📞 <span className="font-semibold">{phoneNumber}</span>
            </p>
            <p className="text-xs text-gray-500">
              ⏰ <span>Available 24/7</span>
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block w-full bg-[#ff6633] text-white text-center py-2 rounded-lg font-semibold hover:bg-[#e55a22] transition"
          >
            Open WhatsApp
          </a>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-bounce {
          animation: bounce 2s infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
