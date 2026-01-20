import { Facebook, Instagram, Linkedin, Twitter, Youtube, MessageCircle, Mail } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  const socialLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      url: "https://www.facebook.com/share/16tgbVhZ9S/",
      color: "hover:text-blue-600",
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://www.instagram.com/paedsresus",
      color: "hover:text-pink-600",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: "https://www.linkedin.com/company/paeds-resus/",
      color: "hover:text-blue-700",
    },
    {
      name: "X (Twitter)",
      icon: Twitter,
      url: "https://x.com/PaedsResus",
      color: "hover:text-gray-900",
    },
    {
      name: "YouTube",
      icon: Youtube,
      url: "https://youtube.com/@paeds_resus",
      color: "hover:text-red-600",
    },
    {
      name: "TikTok",
      icon: MessageCircle,
      url: "https://www.tiktok.com/@paeds.resus",
      color: "hover:text-gray-900",
    },
  ];

  const providerChannels = [
    {
      name: "Telegram - Resources",
      icon: MessageCircle,
      url: "https://t.me/paedsresuscriticalcare",
      description: "Books, guidelines, and updates on paediatric emergencies",
    },
    {
      name: "Telegram - Cardiology",
      icon: MessageCircle,
      url: "https://t.me/paedsresus",
      description: "Paediatric cardiology resources",
    },
    {
      name: "WhatsApp Channel",
      icon: MessageCircle,
      url: "https://whatsapp.com/channel/0029Vaax0toBadmcRFz4S81r",
      description: "Healthcare provider updates and resources",
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* About */}
          <div>
            <h3 className="text-white font-bold mb-4">Paeds Resus</h3>
            <p className="text-sm text-gray-400 mb-4">
              Transforming paediatric emergency care across Kenya through clinical excellence and nurse-led resuscitation.
            </p>
            <p className="text-sm text-gray-400">© 2026 Paeds Resus Limited. All rights reserved.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition">Home</Link></li>
              <li><Link href="/providers" className="hover:text-white transition">For Providers</Link></li>
              <li><Link href="/institutional" className="hover:text-white transition">For Hospitals</Link></li>
              <li><Link href="/parents" className="hover:text-white transition">For Parents</Link></li>
              <li><Link href="/resources" className="hover:text-white transition">Resources</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
              <li><Link href="/support" className="hover:text-white transition">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4">Get In Touch</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:info@paedsresus.com" className="hover:text-white transition">info@paedsresus.com</a>
              </li>
              <li className="text-gray-400">Kenya</li>
            </ul>
          </div>
        </div>

        {/* Provider Channels Section */}
        <div className="border-t border-gray-700 py-8 mb-8">
          <h4 className="text-white font-bold mb-4">Healthcare Provider Channels</h4>
          <p className="text-sm text-gray-400 mb-4">Join our exclusive channels for resources, updates, and professional development:</p>
          <div className="grid md:grid-cols-3 gap-4">
            {providerChannels.map((channel) => (
              <a
                key={channel.name}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-gray-700 p-4 rounded transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <channel.icon className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-semibold text-sm">{channel.name}</span>
                </div>
                <p className="text-xs text-gray-400">{channel.description}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Social Media Links */}
        <div className="border-t border-gray-700 pt-8">
          <h4 className="text-white font-bold mb-4">Follow Us</h4>
          <div className="flex gap-6">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-gray-400 transition ${social.color}`}
                title={social.name}
              >
                <social.icon className="w-6 h-6" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
