import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - HomeU',
  description: 'HomeU Privacy Policy describing how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: March 16, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p>
              HomeU Inc. (&quot;HomeU,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy describes how we collect, use, disclose, and safeguard your personal information when you use the HomeU platform (&quot;Platform&quot;), including our website, mobile applications, and related services.
            </p>
            <p>
              By using the Platform, you consent to the practices described in this Privacy Policy. If you do not agree, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-medium mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, date of birth, and password when you create an account</li>
              <li><strong>Identity Verification (KYC):</strong> Social Security Number (optional), government-issued identification documents, proof of income, and rental history documents</li>
              <li><strong>Financial Information:</strong> Bank account details (routing number, account number, account type) for ACH payment processing</li>
              <li><strong>Property Information:</strong> Residential address, lease details, rent amount, and property manager information</li>
              <li><strong>Business Information (Property Managers):</strong> Company name, Tax ID/EIN, business type, authorized representative details, and business bank account information</li>
              <li><strong>Communications:</strong> Messages, support requests, and feedback you submit through the Platform</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, click patterns, and interaction data</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and IP address</li>
              <li><strong>Location Data:</strong> Approximate location based on IP address (we do not collect precise geolocation)</li>
              <li><strong>Cookies and Tracking:</strong> We use cookies and similar technologies to maintain sessions, remember preferences, and analyze usage patterns</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">2.3 Information from Third Parties</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Payment Processor (Straddle):</strong> Payment status, transaction confirmations, bank account verification results, and fraud screening results</li>
              <li><strong>Identity Verification Services:</strong> KYC/AML screening results and watchlist checks</li>
              <li><strong>Authentication Provider (Clerk):</strong> Authentication tokens and session data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use your information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Payment Processing:</strong> To initiate, process, and track ACH rent payments between renters and property managers</li>
              <li><strong>Identity Verification:</strong> To verify your identity in compliance with KYC/AML regulations and prevent fraud</li>
              <li><strong>Account Management:</strong> To create and maintain your account, authenticate sessions, and provide customer support</li>
              <li><strong>Platform Operations:</strong> To operate, maintain, and improve the Platform&apos;s features and functionality</li>
              <li><strong>Rewards Program:</strong> To calculate, track, and distribute rewards for eligible payment activities</li>
              <li><strong>Communication:</strong> To send transaction confirmations, payment reminders, account alerts, and service updates</li>
              <li><strong>Analytics:</strong> To analyze usage patterns, generate aggregate market insights, and improve our services</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
              <li><strong>Fraud Prevention:</strong> To detect, prevent, and respond to fraud, security threats, and unauthorized activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. How We Share Your Information</h2>
            <p>We may share your information with the following parties:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Payment Processor (Straddle):</strong> Financial and identity information necessary to process ACH payments, verify bank accounts, and perform KYC checks</li>
              <li><strong>Property Managers:</strong> Payment status, amounts, and dates for rent transactions associated with their properties (we do not share your bank account details with property managers)</li>
              <li><strong>Authentication Provider (Clerk):</strong> Account credentials and session data for secure login</li>
              <li><strong>Service Providers:</strong> Third-party vendors who assist with hosting, analytics, customer support, and other operational services, subject to confidentiality agreements</li>
              <li><strong>Legal Requirements:</strong> When required by law, subpoena, court order, or government regulation</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity</li>
            </ul>
            <p className="mt-4 font-medium">
              We do NOT sell your personal information to third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>TLS/SSL encryption for all data in transit</li>
              <li>AES-256 encryption for sensitive data at rest</li>
              <li>Secure bank connection through Straddle&apos;s PCI-compliant Bridge widget</li>
              <li>Multi-factor authentication for account access</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Role-based access controls for internal systems</li>
            </ul>
            <p>
              For more details, please see our <Link href="/security" className="text-blue-600 hover:underline">Information Security Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. For specific retention periods, please see our <Link href="/data-retention" className="text-blue-600 hover:underline">Data Retention Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Your Rights and Choices</h2>
            <p>Depending on your jurisdiction, you may have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal retention requirements</li>
              <li><strong>Portability:</strong> Request a portable copy of your data in a commonly used format</li>
              <li><strong>Opt-Out:</strong> Opt out of promotional communications at any time by following the unsubscribe link in emails or adjusting your notification settings</li>
              <li><strong>Revoke ACH Authorization:</strong> Revoke your ACH payment authorization at any time by contacting us at <a href="mailto:support@homeu.co" className="text-blue-600 hover:underline">support@homeu.co</a></li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at <a href="mailto:privacy@homeu.co" className="text-blue-600 hover:underline">privacy@homeu.co</a>. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. California Privacy Rights (CCPA)</h2>
            <p>
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, the right to request deletion, and the right to opt out of the sale of personal information. HomeU does not sell personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Children&apos;s Privacy</h2>
            <p>
              The Platform is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we learn that we have collected information from a child under 18, we will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on the Platform and updating the &quot;Last Updated&quot; date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact Us</h2>
            <p>If you have questions or concerns about this Privacy Policy, please contact us at:</p>
            <div className="mt-2">
              <p><strong>HomeU Inc.</strong></p>
              <p>Privacy: <a href="mailto:privacy@homeu.co" className="text-blue-600 hover:underline">privacy@homeu.co</a></p>
              <p>General: <a href="mailto:support@homeu.co" className="text-blue-600 hover:underline">support@homeu.co</a></p>
              <p>Compliance: <a href="mailto:compliance@homeu.co" className="text-blue-600 hover:underline">compliance@homeu.co</a></p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
          <div className="flex gap-4">
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/security" className="hover:underline">Security Policy</Link>
            <Link href="/data-retention" className="hover:underline">Data Retention Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
