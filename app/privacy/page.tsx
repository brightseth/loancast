export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none space-y-6">
            <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">Farcaster Account Information</h3>
              <p>
                When you connect your Farcaster account, we access your public profile information including:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Farcaster ID (FID) and username</li>
                <li>Display name and profile picture</li>
                <li>Public follower/following counts</li>
                <li>Connected wallet addresses</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">Loan Activity Data</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Loan requests, amounts, and terms</li>
                <li>Repayment history and status</li>
                <li>Wallet addresses for loan transactions</li>
                <li>Transaction hashes and blockchain data</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">Technical Information</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>IP address and browser information</li>
                <li>Usage patterns and platform interactions</li>
                <li>Error logs and performance metrics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p>We use collected information to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Facilitate peer-to-peer lending transactions</li>
                <li>Calculate and display reputation scores</li>
                <li>Verify loan repayments on the blockchain</li>
                <li>Prevent fraud and maintain platform security</li>
                <li>Improve platform functionality and user experience</li>
                <li>Send optional notifications about loan activity</li>
                <li>Comply with legal requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
              <p>We may share your information in the following circumstances:</p>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">Public Information</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Loan requests are publicly visible on the platform</li>
                <li>Reputation scores and loan history are public</li>
                <li>Blockchain transactions are inherently public</li>
                <li>Farcaster profile information remains as per Farcaster's privacy settings</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">Service Providers</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Supabase (database hosting)</li>
                <li>Vercel (platform hosting)</li>
                <li>PostHog (analytics - anonymized data)</li>
                <li>Sentry (error monitoring)</li>
                <li>Email service providers (if you opt-in to notifications)</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">Legal Requirements</h3>
              <p>
                We may disclose information if required by law, court order, or government request, 
                or to protect the platform and users from fraud or illegal activity.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Blockchain and Cryptocurrency Privacy</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="font-medium text-blue-800">Important: Blockchain Transparency</p>
              </div>
              <p>
                All loan transactions occur on the Base blockchain and are permanently recorded. 
                This includes wallet addresses, transaction amounts, and timestamps. 
                <strong>Blockchain transactions cannot be deleted or made private.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Account data is retained while your account is active</li>
                <li>Loan history and reputation data are retained indefinitely for platform integrity</li>
                <li>Technical logs are retained for 90 days</li>
                <li>Blockchain data is permanent and cannot be deleted</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">Account Control</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Disconnect your Farcaster account at any time</li>
                <li>Request account deletion (loan history may remain for platform integrity)</li>
                <li>Update your profile information through Farcaster</li>
                <li>Opt out of email notifications</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">Data Access</h3>
              <p>
                You can request a copy of your data by contacting us on Farcaster{" "}
                <a href="https://warpcast.com/loancast" className="text-[#6936F5] hover:underline">
                  @loancast
                </a>
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">Limitations</h3>
              <p>
                Due to the decentralized nature of blockchain technology, some data cannot be 
                deleted or modified once recorded on-chain.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Cookies and Tracking</h2>
              <p>We use minimal cookies and local storage for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>User authentication and session management</li>
                <li>Platform functionality and preferences</li>
                <li>Anonymous usage analytics (PostHog)</li>
                <li>Error monitoring and debugging</li>
              </ul>
              <p className="mt-2">
                You can disable cookies in your browser, but this may affect platform functionality.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Security</h2>
              <p>We implement security measures including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>HTTPS encryption for all communications</li>
                <li>Secure authentication through Farcaster</li>
                <li>Regular security audits and updates</li>
                <li>Database security and access controls</li>
                <li>Error monitoring and incident response</li>
              </ul>
              <p className="mt-2">
                However, no system is 100% secure. You are responsible for keeping your 
                Farcaster account and wallet secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. International Users</h2>
              <p>
                LoanCast is operated from the United States. By using the platform, 
                you consent to the transfer and processing of your data in the US, 
                which may have different privacy laws than your country.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p>
                LoanCast is not intended for users under 18 years of age. 
                We do not knowingly collect personal information from children under 18.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Policy Changes</h2>
              <p>
                We may update this privacy policy periodically. Material changes will be 
                announced on our Farcaster channel{" "}
                <a href="https://warpcast.com/loancast" className="text-[#6936F5] hover:underline">
                  @loancast
                </a>
                . Continued use of the platform after changes indicates acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p>
                For privacy-related questions or requests, contact us at:{" "}
                <a href="https://warpcast.com/loancast" className="text-[#6936F5] hover:underline">
                  @loancast on Farcaster
                </a>
              </p>
            </section>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-8">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> This privacy policy covers LoanCast's data practices. 
                Please also review{" "}
                <a href="https://docs.farcaster.xyz/learn/architecture/privacy" className="text-[#6936F5] hover:underline">
                  Farcaster's privacy practices
                </a>{" "}
                for information about how your Farcaster data is handled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}