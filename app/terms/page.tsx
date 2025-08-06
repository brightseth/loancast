export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none space-y-6">
            <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using LoanCast, you accept and agree to be bound by the terms and provision of this agreement. 
                LoanCast is a decentralized peer-to-peer lending platform built on the Farcaster social network.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p>
                LoanCast facilitates peer-to-peer lending between users on the Farcaster network. We provide a platform 
                where users can request loans, fund loans, and manage repayments using USDC on the Base blockchain.
              </p>
              <p>
                <strong>Important:</strong> LoanCast does not provide loans directly. All loans are between users. 
                We are not a financial institution and do not guarantee loan repayment.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-2">As a Borrower:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide accurate information about your loan request</li>
                <li>Repay loans on time as agreed</li>
                <li>Communicate with lenders if facing repayment difficulties</li>
                <li>Maintain your Farcaster account and wallet security</li>
              </ul>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">As a Lender:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Conduct your own due diligence before funding loans</li>
                <li>Understand that loans carry risk of default</li>
                <li>Only lend amounts you can afford to lose</li>
                <li>Provide accurate wallet addresses for repayment</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Risks and Disclaimers</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="font-medium text-amber-800">⚠️ Important Risk Disclosure</p>
              </div>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Default Risk:</strong> Borrowers may fail to repay loans. There is no guarantee of repayment.</li>
                <li><strong>No Insurance:</strong> Loans are not insured or guaranteed by any government agency or institution.</li>
                <li><strong>Blockchain Risks:</strong> Transactions on Base blockchain are irreversible. Smart contract bugs or network issues may occur.</li>
                <li><strong>Regulatory Risk:</strong> Cryptocurrency regulations may change and affect the platform.</li>
                <li><strong>Technical Risk:</strong> Platform downtime, bugs, or security vulnerabilities may occur.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Prohibited Uses</h2>
              <p>You may not use LoanCast for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Illegal activities or money laundering</li>
                <li>Fraud or misrepresentation</li>
                <li>Loans for illegal purposes</li>
                <li>Market manipulation or wash trading</li>
                <li>Spam or harassment of other users</li>
                <li>Circumventing platform security measures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Account Termination</h2>
              <p>
                We reserve the right to suspend or terminate accounts for violations of these terms, 
                suspicious activity, or legal requirements. Users may delete their accounts at any time, 
                but existing loan obligations remain valid.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p>
                LoanCast and its operators shall not be liable for any direct, indirect, incidental, 
                special, or consequential damages resulting from use of the platform, including but not 
                limited to loss of funds, missed repayments, or technical issues.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Privacy and Data</h2>
              <p>
                We collect minimal data necessary to operate the platform. See our{" "}
                <a href="/privacy" className="text-[#6936F5] hover:underline">Privacy Policy</a> for details.
                All blockchain transactions are public by nature.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Dispute Resolution</h2>
              <p>
                Disputes between users should be resolved directly. LoanCast may provide reputation 
                information to assist in dispute resolution but is not obligated to mediate disputes 
                or enforce repayment.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Modifications</h2>
              <p>
                We may update these terms periodically. Continued use of the platform constitutes 
                acceptance of updated terms. Material changes will be announced on our Farcaster channel.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Governing Law</h2>
              <p>
                These terms are governed by the laws of Delaware, USA. Disputes shall be resolved 
                through binding arbitration in Delaware.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              <p>
                Questions about these terms can be addressed to:{" "}
                <a href="https://warpcast.com/loancast" className="text-[#6936F5] hover:underline">
                  @loancast on Farcaster
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}