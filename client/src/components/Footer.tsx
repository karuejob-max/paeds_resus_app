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
    <footer className="bg-brand-teal text-muted-foreground py-8 px-4 border-t-2 border-brand-orange" role="contentinfo" aria-label="Site footer">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* About — one-place terminology explanation */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex rounded-lg bg-white/95 p-0.5 ring-1 ring-white/20">
                <img src="/paeds-resus-logo.png" alt="Paeds Resus" className="w-8 h-8 rounded-md object-contain" />
              </span>
              <h3 className="text-white font-bold">Paeds Resus</h3>
            </div>
            <p className="text-sm text-white/80 mb-2">
              Transforming paediatric emergency care through clinical excellence and nurse-led resuscitation.
            </p>
            <p className="text-xs text-white/70">
              <strong className="text-white/85">Platform:</strong> Paeds Resus (brand). <strong className="text-white/85">Products:</strong> ResusGPS — point-of-care app; Care Signal — provider incident & near-miss reporting; Parent Safe-Truth — for families.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-3 text-brand-orange">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-white/70 hover:text-brand-orange transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/training" className="text-white/70 hover:text-brand-orange transition">
                  Training (BLS, ACLS, PALS)
                </Link>
              </li>
              <li>
                <Link href="/for-providers" className="text-white/70 hover:text-brand-orange transition">
                  For Providers
                </Link>
              </li>
              <li>
                <Link href="/for-institutions" className="text-white/70 hover:text-brand-orange transition">
                  For Institutions
                </Link>
              </li>
              <li>
                <Link href="/for-parents" className="text-white/70 hover:text-brand-orange transition">
                  For Parents
                </Link>
              </li>
              <li>
                <Link href="/institutional" className="text-white/70 hover:text-brand-orange transition">
                  Institutional portal
                </Link>
              </li>
              <li>
                <Link href="/parent-safe-truth" className="text-white/70 hover:text-brand-orange transition">
                  Parent Safe-Truth
                </Link>
              </li>
              <li>
                <Link href="/verify" className="text-white/70 hover:text-brand-orange transition">
                  Verify certificate
                </Link>
              </li>
              <li>
                <a href="mailto:paedsresus254@gmail.com" className="text-white/70 hover:text-brand-orange transition flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Support & Legal — documented destinations per audit */}
          <div>
            <h4 className="text-white font-bold mb-3 text-brand-orange">Support & Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-white/70 hover:text-brand-orange transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white/70 hover:text-brand-orange transition">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/70 hover:text-brand-orange transition">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="text-white/70 hover:text-brand-orange transition">
                  Cookie notice
                </Link>
              </li>
              <li>
                <Link href="/legal/data-request" className="text-white/70 hover:text-brand-orange transition">
                  Data requests
                </Link>
              </li>
              <li>
                <Link href="/legal/subprocessors" className="text-white/70 hover:text-brand-orange transition">
                  Subprocessors
                </Link>
              </li>
              <li>
                <Link href="/legal/care-signal" className="text-white/70 hover:text-brand-orange transition">
                  Care Signal notice
                </Link>
              </li>
              <li>
                <Link href="/legal/clinical-use" className="text-white/70 hover:text-brand-orange transition">
                  ResusGPS intended use
                </Link>
              </li>
              <li>
                <Link href="/care-signal/appeal" className="text-white/70 hover:text-brand-orange transition">
                  Care Signal appeals
                </Link>
              </li>
              <li>
                <a href="mailto:privacy@paeds-resus.com" className="text-white/70 hover:text-brand-orange transition">
                  Contact (privacy)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="border-t border-white/20 pt-6 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-white/70 mb-4 md:mb-0">
            © {currentYear} Paeds Resus. All rights reserved. · Kenya & East African Community
          </p>
          <div className="flex gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-brand-orange transition"
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
