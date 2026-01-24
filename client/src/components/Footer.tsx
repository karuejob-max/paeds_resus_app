import { Link } from "wouter";
import { Facebook, Instagram, Linkedin, Twitter, Youtube, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      url: "https://www.facebook.com/share/16tgbVhZ9S/",
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://www.instagram.com/paedsresus",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: "https://www.linkedin.com/company/paeds-resus/",
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: "https://x.com/PaedsResus",
    },
    {
      name: "YouTube",
      icon: Youtube,
      url: "https://youtube.com/@paeds_resus",
    },
  ];

  return (
    <footer className="bg-[#0d3333] text-gray-300 py-8 px-4 border-t-2 border-[#ff6633]">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/paeds-resus-logo.png" alt="Paeds Resus" className="w-8 h-8" />
              <h3 className="text-white font-bold">Paeds Resus</h3>
            </div>
            <p className="text-sm text-gray-400">
              Transforming paediatric emergency care through clinical excellence and nurse-led resuscitation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-3 text-[#ff6633]">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-[#ff6633] transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/institutional" className="text-gray-400 hover:text-[#ff6633] transition">
                  For Providers
                </Link>
              </li>
              <li>
                <Link href="/parent-safe-truth" className="text-gray-400 hover:text-[#ff6633] transition">
                  For Parents
                </Link>
              </li>
              <li>
                <a href="mailto:paedsresus254@gmail.com" className="text-gray-400 hover:text-[#ff6633] transition flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold mb-3 text-[#ff6633]">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-[#ff6633] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-[#ff6633] transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-[#ff6633] transition">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="border-t border-gray-600 pt-6 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-400 mb-4 md:mb-0">
            © {currentYear} Paeds Resus Limited. All rights reserved.
          </p>
          <div className="flex gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#ff6633] transition"
                title={social.name}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
