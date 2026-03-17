import Link from 'next/link';

export const metadata = {
  title: 'Information Security Policy - HomeU',
  description: 'HomeU Information Security and Data Security policies for protecting user and financial data.',
};

export default function SecurityPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Information Security &amp; Data Security Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: March 16, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">

          {/* INFORMATION SECURITY POLICY */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Purpose and Scope</h2>
            <p>
              This Information Security Policy establishes the framework for protecting the confidentiality, integrity, and availability of all information assets managed by HomeU Inc. (&quot;HomeU&quot;). This policy applies to all employees, contractors, and third-party service providers who access HomeU systems and data.
            </p>
            <p>
              As a platform that processes financial transactions and sensitive personal information, HomeU is committed to maintaining the highest standards of information security in compliance with applicable regulations, including Nacha Operating Rules, federal financial regulations, and state data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information Security Governance</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Security Ownership:</strong> HomeU&apos;s compliance team is responsible for the development, implementation, and enforcement of security policies</li>
              <li><strong>Risk Assessment:</strong> We conduct regular risk assessments to identify, evaluate, and mitigate threats to our information assets</li>
              <li><strong>Incident Response:</strong> We maintain an incident response plan that includes detection, containment, eradication, recovery, and post-incident review procedures</li>
              <li><strong>Third-Party Risk Management:</strong> All third-party vendors with access to user data undergo security assessments before engagement and are bound by data processing agreements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Access Control</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Principle of Least Privilege:</strong> Access to systems and data is granted on a need-to-know basis with the minimum permissions required</li>
              <li><strong>Multi-Factor Authentication (MFA):</strong> Required for all internal system access and administrative functions</li>
              <li><strong>User Authentication:</strong> End-user authentication is managed through Clerk, providing secure session management and optional MFA for user accounts</li>
              <li><strong>Property Manager Authentication:</strong> Property managers authenticate through WorkOS with enterprise-grade security controls</li>
              <li><strong>Access Reviews:</strong> User access rights are reviewed quarterly and promptly revoked upon role change or termination</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Classification</h2>
            <p>HomeU classifies data into the following categories:</p>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-200 mt-4">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Classification</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Examples</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Controls</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Restricted</td>
                    <td className="border border-gray-200 px-4 py-2">SSN, bank account numbers, KYC documents, PayKeys</td>
                    <td className="border border-gray-200 px-4 py-2">Encrypted at rest and in transit, strict access controls, audit logging</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Confidential</td>
                    <td className="border border-gray-200 px-4 py-2">Name, email, phone, address, payment history, lease details</td>
                    <td className="border border-gray-200 px-4 py-2">Encrypted in transit, access controls, audit logging</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Internal</td>
                    <td className="border border-gray-200 px-4 py-2">Aggregate analytics, system configurations, internal documentation</td>
                    <td className="border border-gray-200 px-4 py-2">Access controls, standard security measures</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Public</td>
                    <td className="border border-gray-200 px-4 py-2">Marketing materials, public policies, general property listings</td>
                    <td className="border border-gray-200 px-4 py-2">Standard integrity controls</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* DATA SECURITY POLICY */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Security Controls</h2>

            <h3 className="text-xl font-medium mt-6 mb-3">5.1 Encryption</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>In Transit:</strong> All data transmitted between clients and servers uses TLS 1.2 or higher. API communications with payment processors use mutual TLS where supported</li>
              <li><strong>At Rest:</strong> Sensitive data (SSN, bank account numbers, KYC documents) is encrypted using AES-256 encryption</li>
              <li><strong>Key Management:</strong> Encryption keys are managed through secure key management services with regular rotation</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">5.2 Financial Data Protection</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Bank Account Security:</strong> HomeU does not directly store raw bank account credentials. Bank connections are established through Straddle&apos;s secure Bridge widget, which returns a tokenized PayKey</li>
              <li><strong>Payment Tokens (PayKeys):</strong> Stored securely and used as references for payment processing without exposing underlying bank details</li>
              <li><strong>PCI Compliance:</strong> Payment card data, where applicable, is handled by PCI-DSS compliant processors. HomeU does not store, process, or transmit cardholder data directly</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">5.3 Infrastructure Security</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cloud Hosting:</strong> The Platform is hosted on enterprise-grade cloud infrastructure with SOC 2 Type II certification</li>
              <li><strong>Database Security:</strong> Convex provides a managed, serverless database with built-in security controls, access isolation, and automatic backups</li>
              <li><strong>API Security:</strong> All API endpoints require authentication via JWT tokens issued by Clerk. Rate limiting and input validation are enforced at all endpoints</li>
              <li><strong>Deployment Security:</strong> Deployments follow CI/CD best practices with automated security scanning</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">5.4 Application Security</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Input Validation:</strong> All user inputs are validated using Zod schemas on both client and server sides to prevent injection attacks</li>
              <li><strong>Authentication:</strong> Managed by Clerk with secure session handling, CSRF protection, and optional MFA</li>
              <li><strong>Authorization:</strong> Role-based access control (RBAC) enforced at the application and database level, separating renter, property manager, and admin permissions</li>
              <li><strong>Dependency Management:</strong> Regular audits of third-party dependencies for known vulnerabilities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. ACH and Payment Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Nacha Compliance:</strong> All ACH transactions comply with Nacha Operating Rules, including proper authorization capture, transaction formatting, and return handling</li>
              <li><strong>Fraud Prevention:</strong> Straddle&apos;s Watchtower provides real-time fraud detection including device fingerprinting, velocity checks, and behavioral analysis</li>
              <li><strong>Balance Verification:</strong> Account balance is confirmed before payment processing to reduce returned transactions</li>
              <li><strong>Transaction Monitoring:</strong> All payment transactions are logged and monitored for suspicious activity</li>
              <li><strong>Multi-Rail Processing:</strong> Payments are routed through ACH, RTP, or FedNow based on optimal processing criteria</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Incident Response</h2>
            <p>HomeU maintains an incident response plan covering:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Detection:</strong> Automated monitoring and alerting for security anomalies, unauthorized access attempts, and system integrity issues</li>
              <li><strong>Containment:</strong> Immediate isolation of affected systems to prevent further compromise</li>
              <li><strong>Notification:</strong> Timely notification to affected users and relevant authorities as required by applicable breach notification laws</li>
              <li><strong>Recovery:</strong> Systematic restoration of services with verification of system integrity</li>
              <li><strong>Post-Incident Review:</strong> Root cause analysis and implementation of corrective measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Employee and Contractor Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Background checks for all personnel with access to sensitive data</li>
              <li>Security awareness training during onboarding and annually thereafter</li>
              <li>Confidentiality and non-disclosure agreements for all personnel</li>
              <li>Immediate access revocation upon termination or role change</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Business Continuity</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Backups:</strong> Automated daily backups of all critical data with point-in-time recovery capability</li>
              <li><strong>Disaster Recovery:</strong> Recovery procedures designed to restore services within defined recovery time objectives (RTO) and recovery point objectives (RPO)</li>
              <li><strong>Redundancy:</strong> Critical services are deployed with geographic redundancy to ensure availability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Policy Review</h2>
            <p>
              This policy is reviewed and updated at least annually, or more frequently as needed in response to changes in regulations, technology, or business operations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact</h2>
            <p>For security concerns or to report a vulnerability, please contact:</p>
            <div className="mt-2">
              <p><strong>HomeU Security Team</strong></p>
              <p>Email: <a href="mailto:security@homeu.co" className="text-blue-600 hover:underline">security@homeu.co</a></p>
              <p>Compliance: <a href="mailto:compliance@homeu.co" className="text-blue-600 hover:underline">compliance@homeu.co</a></p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
          <div className="flex gap-4">
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/data-retention" className="hover:underline">Data Retention Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
