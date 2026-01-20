import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Legal
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-4">Last updated: January 2026</p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Introduction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p>
                Paeds Resus Limited ("we", "us", "our", or "Company") operates the Paeds Resus platform. This page
                informs you of our policies regarding the collection, use, and disclosure of personal data when you use
                our platform and the choices you have associated with that data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Information Collection and Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p>We collect several different types of information for various purposes:</p>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold">Personal Data:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Name, email address, phone number</li>
                    <li>Professional credentials and qualifications</li>
                    <li>Institution or organization details</li>
                    <li>Payment information</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">Usage Data:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Pages visited and time spent</li>
                    <li>Browser type and version</li>
                    <li>IP address and location data</li>
                    <li>Course progress and completion data</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Use of Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p>Paeds Resus uses the collected data for various purposes:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>To provide and maintain our platform</li>
                <li>To notify you about changes to our platform</li>
                <li>To allow you to participate in interactive features</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information for service improvement</li>
                <li>To monitor the usage of our platform</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Security of Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p>
                The security of your data is important to us but remember that no method of transmission over the
                Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable
                means to protect your personal data, we cannot guarantee its absolute security.
              </p>
              <p>
                We implement industry-standard security measures including SSL encryption, firewalls, and regular
                security audits to protect your information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. GDPR Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p>
                If you are a resident of the European Union (EU) or European Economic Area (EEA), you have certain data
                protection rights covered by the General Data Protection Regulation (GDPR).
              </p>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Restrict processing of your data</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p>
                We use cookies and similar tracking technologies to track activity on our platform and hold certain
                information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being
                sent. However, if you do not accept cookies, you may not be able to use some portions of our platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p>
                Our platform may contain links to third-party sites that are not operated by us. This Privacy Policy
                does not apply to third-party websites, and we are not responsible for their privacy practices. We
                encourage you to review the privacy policies of any third-party sites before providing your personal
                information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p>
                Our platform is not intended for use by individuals under the age of 18. We do not knowingly collect
                personal information from children under 18. If we become aware that a child under 18 has provided us
                with personal information, we will delete such information and terminate the child's account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
                Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p>
                <strong>Email:</strong> privacy@paedsresus.com<br />
                <strong>Phone:</strong> +254 712 345 678<br />
                <strong>Address:</strong> Nairobi, Kenya
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p>
                We retain your personal data only for as long as necessary to provide our services and fulfill the
                purposes outlined in this Privacy Policy. You can request deletion of your data at any time by contacting
                us.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p>
                You have the right to access, update, or delete the information we have on you. Whenever made possible,
                you can access, update, or request deletion of your personal data directly within your account settings.
                If you are unable to perform these actions yourself, please contact us to assist you.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
