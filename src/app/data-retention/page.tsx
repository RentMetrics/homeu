import Link from 'next/link';

export const metadata = {
  title: 'Data Retention Policy - HomeU',
  description: 'HomeU Data Retention Policy describing how long we retain user data and how data is disposed of.',
};

export default function DataRetentionPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Data Retention Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: March 16, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Purpose</h2>
            <p>
              This Data Retention Policy outlines how HomeU Inc. (&quot;HomeU&quot;) manages the retention and disposal of data collected through the HomeU platform. The purpose of this policy is to ensure that data is retained only for as long as necessary to fulfill its intended purpose, comply with legal and regulatory requirements, and protect the interests of our users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Scope</h2>
            <p>
              This policy applies to all personal data, financial data, and transaction records collected and processed by HomeU, including data stored in our primary database (Convex), third-party processors (Straddle, Clerk), and any backups or archives.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Retention Schedule</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-200 mt-4">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Data Category</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Examples</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Retention Period</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Basis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Account Information</td>
                    <td className="border border-gray-200 px-4 py-2">Name, email, phone, address</td>
                    <td className="border border-gray-200 px-4 py-2">Duration of account + 3 years after closure</td>
                    <td className="border border-gray-200 px-4 py-2">Business necessity, dispute resolution</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">ACH Payment Records</td>
                    <td className="border border-gray-200 px-4 py-2">Transaction IDs, amounts, dates, status</td>
                    <td className="border border-gray-200 px-4 py-2">7 years from transaction date</td>
                    <td className="border border-gray-200 px-4 py-2">Nacha rules, IRS requirements, UCC</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">ACH Authorization Records</td>
                    <td className="border border-gray-200 px-4 py-2">Authorization consent, timestamps, IP addresses</td>
                    <td className="border border-gray-200 px-4 py-2">2 years after authorization revocation</td>
                    <td className="border border-gray-200 px-4 py-2">Nacha Operating Rules</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">KYC/Identity Verification</td>
                    <td className="border border-gray-200 px-4 py-2">SSN, ID documents, verification results</td>
                    <td className="border border-gray-200 px-4 py-2">5 years after account closure</td>
                    <td className="border border-gray-200 px-4 py-2">BSA/AML regulations, FinCEN requirements</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Bank Account Tokens (PayKeys)</td>
                    <td className="border border-gray-200 px-4 py-2">Tokenized bank references</td>
                    <td className="border border-gray-200 px-4 py-2">Until disconnected by user + 90 days</td>
                    <td className="border border-gray-200 px-4 py-2">Operational necessity</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Rental History</td>
                    <td className="border border-gray-200 px-4 py-2">Lease details, payment history, property associations</td>
                    <td className="border border-gray-200 px-4 py-2">Duration of account + 7 years</td>
                    <td className="border border-gray-200 px-4 py-2">Credit reporting, tenant verification</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Property Manager Business Data</td>
                    <td className="border border-gray-200 px-4 py-2">Business info, Tax ID, representative details</td>
                    <td className="border border-gray-200 px-4 py-2">Duration of account + 5 years</td>
                    <td className="border border-gray-200 px-4 py-2">Tax reporting, regulatory compliance</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Audit Logs</td>
                    <td className="border border-gray-200 px-4 py-2">System access logs, admin actions, security events</td>
                    <td className="border border-gray-200 px-4 py-2">3 years</td>
                    <td className="border border-gray-200 px-4 py-2">Security monitoring, incident investigation</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Session and Authentication Data</td>
                    <td className="border border-gray-200 px-4 py-2">Login sessions, tokens, device info</td>
                    <td className="border border-gray-200 px-4 py-2">Duration of session + 30 days</td>
                    <td className="border border-gray-200 px-4 py-2">Security, fraud detection</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Rewards Data</td>
                    <td className="border border-gray-200 px-4 py-2">Points balance, redemption history</td>
                    <td className="border border-gray-200 px-4 py-2">Duration of account + 1 year</td>
                    <td className="border border-gray-200 px-4 py-2">Program administration</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Support Communications</td>
                    <td className="border border-gray-200 px-4 py-2">Support tickets, emails, chat transcripts</td>
                    <td className="border border-gray-200 px-4 py-2">3 years from resolution</td>
                    <td className="border border-gray-200 px-4 py-2">Service quality, dispute resolution</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Disposal</h2>
            <p>When data reaches the end of its retention period:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Electronic Data:</strong> Securely deleted using cryptographic erasure or overwriting methods that prevent recovery</li>
              <li><strong>Database Records:</strong> Permanently removed from primary databases and propagated to all replicas and backups within the backup rotation cycle</li>
              <li><strong>Third-Party Data:</strong> Deletion requests are sent to third-party processors (Straddle, Clerk) to ensure data is removed from their systems in accordance with their data processing agreements</li>
              <li><strong>Backups:</strong> Data in backups is purged as backup sets rotate out, typically within 90 days of the retention period expiration</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. User-Initiated Deletion</h2>
            <p>
              Users may request deletion of their account and associated data by contacting <a href="mailto:privacy@homeu.co" className="text-blue-600 hover:underline">privacy@homeu.co</a>. Upon receiving a valid deletion request:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We will delete or anonymize personal data within 30 days, except where retention is required by law</li>
              <li>Financial transaction records subject to regulatory retention periods will be retained as specified above but access-restricted</li>
              <li>KYC records subject to AML requirements will be retained as required but isolated from active systems</li>
              <li>Users will receive confirmation when deletion is complete</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Legal Holds</h2>
            <p>
              In the event of litigation, regulatory investigation, or legal dispute, HomeU may place a legal hold on relevant data, suspending the normal retention schedule until the hold is lifted. Legal holds are managed by HomeU&apos;s compliance team and are applied narrowly to relevant data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Third-Party Data Processors</h2>
            <p>
              HomeU requires all third-party data processors to maintain data retention practices consistent with this policy through contractual data processing agreements. Key processors include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Straddle:</strong> Payment processing data retained per Nacha requirements and their data retention policies</li>
              <li><strong>Clerk:</strong> Authentication data retained for the duration of user accounts</li>
              <li><strong>Convex:</strong> Primary database with automated backup and retention management</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Policy Review</h2>
            <p>
              This Data Retention Policy is reviewed annually and updated as needed to reflect changes in legal requirements, business needs, or technology infrastructure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact</h2>
            <p>For questions about data retention or to submit a deletion request:</p>
            <div className="mt-2">
              <p><strong>HomeU Inc.</strong></p>
              <p>Privacy: <a href="mailto:privacy@homeu.co" className="text-blue-600 hover:underline">privacy@homeu.co</a></p>
              <p>Compliance: <a href="mailto:compliance@homeu.co" className="text-blue-600 hover:underline">compliance@homeu.co</a></p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
          <div className="flex gap-4">
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/security" className="hover:underline">Security Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
