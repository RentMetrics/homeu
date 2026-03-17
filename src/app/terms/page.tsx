import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - HomeU',
  description: 'HomeU Terms of Service governing use of our rental payment and property management platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last Updated: March 16, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the HomeU platform (&quot;Platform&quot;), operated by HomeU Inc. (&quot;HomeU,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the Platform.
            </p>
            <p>
              These Terms apply to all users of the Platform, including renters, property managers, property owners, and any other visitors or users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Services</h2>
            <p>HomeU provides a rental ecosystem platform that enables:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Renters to make rent payments via ACH bank transfer, credit/debit card, or other supported methods</li>
              <li>Property managers to collect rent payments, manage residents, and configure payout settings</li>
              <li>Identity verification and Know Your Customer (KYC) compliance for secure transactions</li>
              <li>Rental history tracking, credit-building tools, and renter verification services</li>
              <li>Rewards and incentive programs for on-time rent payments</li>
              <li>Property analytics and market data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Account Registration and Eligibility</h2>
            <p>
              To use certain features of the Platform, you must create an account. You must be at least 18 years of age and a legal resident of the United States. You agree to provide accurate, current, and complete information during registration and to update such information as necessary.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Payment Services and ACH Authorization</h2>
            <h3 className="text-xl font-medium mt-6 mb-3">4.1 Payment Processing</h3>
            <p>
              HomeU facilitates rent payments between renters and property managers through third-party payment processors, including Straddle (&quot;Payment Processor&quot;). HomeU is not a bank, money transmitter, or financial institution. All payment processing is handled by our licensed Payment Processor partners.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">4.2 ACH Authorization</h3>
            <p>
              By initiating an ACH payment through the Platform, you authorize HomeU and its Payment Processor to debit the specified amount from your designated bank account via the Automated Clearing House (ACH) network. This authorization remains in effect until you revoke it by contacting us or disconnecting your bank account through the Platform.
            </p>
            <p>Key ACH authorization terms:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Each payment requires your explicit confirmation before processing</li>
              <li>You authorize HomeU to initiate electronic debit entries to your bank account for the amounts you approve</li>
              <li>You may revoke this authorization at any time by providing written notice to HomeU at <a href="mailto:support@homeu.co" className="text-blue-600 hover:underline">support@homeu.co</a>, with revocation effective within 3 business days of receipt</li>
              <li>ACH transactions are governed by the rules of the National Automated Clearing House Association (Nacha)</li>
              <li>You have the right to dispute any unauthorized or erroneous ACH debit by contacting your financial institution within 60 days of the transaction</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">4.3 Bank Account Verification</h3>
            <p>
              To initiate ACH payments, you must connect and verify a valid U.S. bank account through our secure bank connection process powered by Straddle. HomeU may verify your bank account ownership and balance availability before processing payments.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">4.4 Payment Timing and Failures</h3>
            <p>
              ACH payments typically settle within 1-3 business days. HomeU is not responsible for delays caused by bank processing times, insufficient funds, or incorrect bank information. Failed payments may be subject to retry attempts and/or late fees as determined by your property manager.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Identity Verification (KYC)</h2>
            <p>
              To comply with federal regulations and prevent fraud, HomeU requires identity verification before enabling payment features. You consent to the collection and verification of your personal information, including but not limited to your name, date of birth, address, Social Security Number (where required), and government-issued identification documents.
            </p>
            <p>
              Verification is performed by our Payment Processor and complies with applicable anti-money laundering (AML) and Know Your Customer (KYC) regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Property Manager Terms</h2>
            <p>
              Property managers using the Platform to collect rent payments agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate business information during onboarding</li>
              <li>Comply with all applicable federal, state, and local laws regarding rent collection</li>
              <li>Accept the platform fee structure (currently 2.9% + $0.30 per rent payment) which is deducted from payouts</li>
              <li>Maintain accurate records of tenant obligations and rent amounts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Fees</h2>
            <p>
              HomeU may charge fees for certain services. All applicable fees will be disclosed to you before you complete a transaction. Renter ACH payments currently carry no processing fee. Property managers are subject to the fee schedule outlined during onboarding.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Rewards Program</h2>
            <p>
              HomeU may offer a rewards program for eligible users. Rewards are subject to separate program terms, may be modified or discontinued at any time, and have no cash value unless explicitly stated. HomeU reserves the right to adjust, suspend, or terminate rewards at its sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Platform for any unlawful purpose or in violation of these Terms</li>
              <li>Provide false, misleading, or inaccurate information</li>
              <li>Initiate payments from accounts you do not own or are not authorized to use</li>
              <li>Attempt to circumvent security measures or access unauthorized areas of the Platform</li>
              <li>Use the Platform to facilitate money laundering, fraud, or other financial crimes</li>
              <li>Interfere with or disrupt the Platform or its infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Intellectual Property</h2>
            <p>
              All content, features, and functionality of the Platform, including but not limited to text, graphics, logos, icons, software, and the HomeU name and branding, are the exclusive property of HomeU Inc. and are protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Disclaimer of Warranties</h2>
            <p>
              THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. HOMEU DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE. HOMEU DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, HOMEU SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE PLATFORM. HOMEU&apos;S TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT OF FEES PAID BY YOU TO HOMEU IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless HomeU, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising out of your use of the Platform or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Termination</h2>
            <p>
              HomeU may suspend or terminate your access to the Platform at any time, with or without cause, and with or without notice. Upon termination, all rights granted to you under these Terms will immediately cease. Any pending payments will be processed or refunded as applicable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">15. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms are governed by the laws of the State of Utah, without regard to conflict of law principles. Any disputes arising from these Terms or your use of the Platform shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except where prohibited by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">16. Changes to These Terms</h2>
            <p>
              HomeU reserves the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on the Platform and updating the &quot;Last Updated&quot; date. Your continued use of the Platform after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">17. Contact Information</h2>
            <p>If you have questions about these Terms, please contact us at:</p>
            <div className="mt-2">
              <p><strong>HomeU Inc.</strong></p>
              <p>Email: <a href="mailto:support@homeu.co" className="text-blue-600 hover:underline">support@homeu.co</a></p>
              <p>Compliance: <a href="mailto:compliance@homeu.co" className="text-blue-600 hover:underline">compliance@homeu.co</a></p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/security" className="hover:underline">Security Policy</Link>
            <Link href="/data-retention" className="hover:underline">Data Retention Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
