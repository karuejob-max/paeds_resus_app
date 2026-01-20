import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Copy, Phone, Clock, AlertCircle } from "lucide-react";

export default function PaymentInstructions() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const mpesaDetails = {
    businessNumber: "174379",
    businessName: "Paeds Resus Limited",
    amount: "10,000 - 150,000 KES depending on course",
  };

  const bankDetails = {
    bankName: "Kenya Commercial Bank (KCB)",
    accountName: "Paeds Resus Limited",
    accountNumber: "1234567890",
    branchCode: "001",
    swiftCode: "KCBLKENA",
    currency: "KES",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Payment Methods
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Payment Instructions
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Multiple secure payment options to suit your preference
          </p>
        </div>
      </section>

      {/* Quick Info */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white border-b">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <Clock className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-semibold mb-2">Processing Time</h3>
                <p className="text-sm text-gray-600">M-Pesa: Instant | Bank: 1-2 business days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="font-semibold mb-2">Secure Payment</h3>
                <p className="text-sm text-gray-600">All transactions are encrypted and secure</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Phone className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="font-semibold mb-2">Support</h3>
                <p className="text-sm text-gray-600">Call +254 712 345 678 for assistance</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="mpesa" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
              <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
            </TabsList>

            {/* M-Pesa Tab */}
            <TabsContent value="mpesa" className="space-y-6">
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-900">M-Pesa Payment (Recommended)</CardTitle>
                  <CardDescription className="text-green-800">
                    Fast, secure, and convenient payment method
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step-by-Step Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      step: 1,
                      title: "Open M-Pesa on Your Phone",
                      description: "Open the M-Pesa menu on your mobile phone",
                    },
                    {
                      step: 2,
                      title: "Select Lipa na M-Pesa Online",
                      description: "Choose the Lipa na M-Pesa Online option from the menu",
                    },
                    {
                      step: 3,
                      title: "Enter Business Number",
                      description: `Enter the business number: ${mpesaDetails.businessNumber}`,
                    },
                    {
                      step: 4,
                      title: "Enter Amount",
                      description: "Enter the enrollment amount as specified in your invoice",
                    },
                    {
                      step: 5,
                      title: "Enter Reference",
                      description: "Use your enrollment ID as the reference number",
                    },
                    {
                      step: 6,
                      title: "Confirm Payment",
                      description: "Enter your M-Pesa PIN to confirm the payment",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>M-Pesa Business Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <p className="text-sm text-gray-600 mb-2">Business Number</p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-mono font-semibold text-gray-900">
                          {mpesaDetails.businessNumber}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(mpesaDetails.businessNumber, "mpesa-number")}
                        >
                          {copiedField === "mpesa-number" ? "Copied!" : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-gray-50">
                      <p className="text-sm text-gray-600 mb-2">Business Name</p>
                      <p className="text-lg font-semibold text-gray-900">{mpesaDetails.businessName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Important Notes</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Payment is processed instantly</li>
                        <li>• You will receive an SMS confirmation immediately</li>
                        <li>• Your enrollment will be activated upon payment confirmation</li>
                        <li>• Keep your M-Pesa receipt for your records</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bank Transfer Tab */}
            <TabsContent value="bank" className="space-y-6">
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-900">Bank Transfer</CardTitle>
                  <CardDescription className="text-blue-800">
                    Direct bank transfer for institutional and bulk payments
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step-by-Step Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      step: 1,
                      title: "Log Into Your Bank",
                      description: "Access your bank account through online banking or mobile app",
                    },
                    {
                      step: 2,
                      title: "Select Transfer Option",
                      description: "Choose the domestic transfer or direct deposit option",
                    },
                    {
                      step: 3,
                      title: "Enter Recipient Details",
                      description: "Enter the bank details provided below",
                    },
                    {
                      step: 4,
                      title: "Enter Amount",
                      description: "Enter the enrollment amount from your invoice",
                    },
                    {
                      step: 5,
                      title: "Add Reference",
                      description: "Use your enrollment ID as the reference/memo",
                    },
                    {
                      step: 6,
                      title: "Confirm and Send",
                      description: "Review details and confirm the transfer",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bank Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {[
                      { label: "Bank Name", value: bankDetails.bankName, field: "bank-name" },
                      { label: "Account Name", value: bankDetails.accountName, field: "account-name" },
                      { label: "Account Number", value: bankDetails.accountNumber, field: "account-number" },
                      { label: "Branch Code", value: bankDetails.branchCode, field: "branch-code" },
                      { label: "SWIFT Code", value: bankDetails.swiftCode, field: "swift-code" },
                      { label: "Currency", value: bankDetails.currency, field: "currency" },
                    ].map((item) => (
                      <div key={item.field} className="border rounded-lg p-4 bg-gray-50">
                        <p className="text-sm text-gray-600 mb-2">{item.label}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-mono font-semibold text-gray-900">{item.value}</p>
                          {item.field !== "currency" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(item.value, item.field)}
                            >
                              {copiedField === item.field ? "Copied!" : <Copy className="w-4 h-4" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Important Notes</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Processing time: 1-2 business days</li>
                        <li>• Please include your enrollment ID in the reference field</li>
                        <li>• Confirm receipt of payment via email to confirm@paedsresus.com</li>
                        <li>• Keep your bank receipt for your records</li>
                        <li>• For international transfers, use the SWIFT code</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Is my payment secure?",
                a: "Yes, all payments are processed through secure, encrypted channels. M-Pesa and bank transfers are both PCI-DSS compliant.",
              },
              {
                q: "How long does payment processing take?",
                a: "M-Pesa payments are instant. Bank transfers typically take 1-2 business days to appear in our account.",
              },
              {
                q: "Can I get a refund?",
                a: "Refunds are available within 7 days of payment if you haven't started the program. Please contact support@paedsresus.com.",
              },
              {
                q: "What if my payment fails?",
                a: "If your payment fails, you'll receive an error message. Please check your account balance and try again, or contact our support team.",
              },
              {
                q: "Do you accept other payment methods?",
                a: "Currently, we accept M-Pesa and bank transfers. We're working on adding more payment methods soon.",
              },
              {
                q: "How do I confirm my payment was received?",
                a: "You'll receive an email confirmation within 24 hours of successful payment. You can also check your enrollment status in your dashboard.",
              },
            ].map((faq, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Need Help?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Our support team is available to assist you with payment-related questions
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <Phone className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Phone</h3>
                <p className="text-gray-600">+254 712 345 678</p>
                <p className="text-sm text-gray-500">Mon-Fri, 8am-5pm EAT</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-gray-600">support@paedsresus.com</p>
                <p className="text-sm text-gray-500">Response within 24 hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Live Chat</h3>
                <p className="text-gray-600">Available on website</p>
                <p className="text-sm text-gray-500">Real-time support</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
