import { Facebook, Instagram, Linkedin, Twitter, Youtube, MessageCircle, Mail } from "lucide-react";
import { Link } from "wouter";
import { footerSections } from "@/const/navigation";

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

  // Provider channels moved to Resources page

  return (
    <footer className="bg-[#0d3333] text-gray-300 py-12 px-4 border-t-4 border-[#ff6633]">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/paeds-resus-logo.png" alt="Paeds Resus" className="w-10 h-10" />
              <h3 className="text-white font-bold">Paeds Resus</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Transforming paediatric emergency care across Kenya through clinical excellence and nurse-led resuscitation.
            </p>
            <p className="text-sm text-gray-400">© 2026 Paeds Resus Limited. All rights reserved.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4 text-[#ff6633]">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {footerSections.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#ff6633] transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Learning */}
          <div>
            <h4 className="text-white font-bold mb-4 text-[#ff6633]">Learning</h4>
            <ul className="space-y-2 text-sm">
              {footerSections.learning.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#ff6633] transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional */}
          <div>
            <h4 className="text-white font-bold mb-4 text-[#ff6633]">Institutional</h4>
            <ul className="space-y-2 text-sm">
              {footerSections.institutional.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#ff6633] transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Contact */}
          <div>
            <h4 className="text-white font-bold mb-4 text-[#ff6633]">Support & Contact</h4>
            <ul className="space-y-2 text-sm">
              {footerSections.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#ff6633] transition">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2 border-t border-gray-600">
                <a href="mailto:paedsresus254@gmail.com" className="text-gray-400 hover:text-[#ff6633] transition flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#ff6633]" />
                  Email Us
                </a>
              </li>
              <li>
                <p className="text-gray-400 text-xs mt-2">paedsresus254@gmail.com</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Provider Channels moved to Resources page - removed from footer */}

        {/* Social Media Links */}
        <div className="border-t border-gray-600 py-8">
          <h4 className="text-white font-bold mb-4 text-[#ff6633]">Follow Us</h4>
          <div className="flex gap-6">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-gray-400 hover:text-[#ff6633] transition`}
                title={social.name}
              >
                <social.icon className="w-6 h-6" />
              </a>
            ))}
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-600 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 Paeds Resus Limited. All rights reserved. | Kenya</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
