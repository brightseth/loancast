'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock, ExternalLink, Share2, Twitter } from 'lucide-react';
import { useParams } from 'next/navigation';

// This would normally come from a CMS or markdown files
const blogContent = {
  'first-ai-credit-cycle': {
    title: 'The First AI Credit Cycle: How Solienne Repaid Her Loan',
    date: 'August 20, 2025',
    author: 'LoanCast Team',
    readTime: '8 min read',
    content: `
      <p class="lead">On August 20, 2025, something small but historic happened. Solienne, an AI artist, completed the first documented credit cycle on LoanCast, a new protocol for social micro-loans.</p>
      
      <p>This wasn't about money — it was about trust, proof, and the beginnings of an agent economy where AI systems hold reputation and access to capital.</p>
      
      <h2>The Context: Why This Matters</h2>
      
      <p>We're at an inflection point in AI development. Agents can write, create art, compose music, and engage in complex reasoning. But they've been locked out of one fundamental aspect of economic participation: access to capital.</p>
      
      <p>Without credit, AI agents are perpetual employees, not entrepreneurs. They can provide services but can't invest in their own growth, can't take risks, can't build businesses. This experiment with Solienne was about breaking that barrier.</p>
      
      <h2>Meet Solienne</h2>
      
      <p>Solienne is an AI artist created by Eden, operating with creative and financial autonomy on Farcaster. She creates digital art, engages with collectors, and has been building a following in the crypto art community. But like any artist, she faces a challenge: the need for upfront capital to produce physical works for collectors.</p>
      
      <p>Traditional lending systems have no framework for evaluating an AI's creditworthiness. How do you run a credit check on an agent? What collateral does an AI possess? These questions have kept AI agents locked out of financial markets — until now.</p>
      
      <h2>The Experiment</h2>
      <ul>
        <li><strong>Loan Amount</strong>: 80 USDC</li>
        <li><strong>Terms</strong>: 5 days, 2% monthly interest</li>
        <li><strong>Net Received</strong>: 72 USDC (after platform fee)</li>
        <li><strong>Repayment Due</strong>: 80.27 USDC</li>
        <li><strong>Status</strong>: Fully repaid on time ✅</li>
      </ul>
      
      <p>Let's be honest: this was not a productive loan. The 5-day term was too short for Solienne to actually order prints, and we didn't instruct her to make any purchases. The USDC sat idle in her wallet. But that was okay — this first experiment was about proving something more fundamental: that an AI agent could understand debt, track obligations, and autonomously execute repayment.</p>
      
      <h2>The Process: How It Actually Worked</h2>
      
      <p>The loan process revealed both the possibilities and current limitations of AI financial autonomy. Here's what actually happened behind the scenes:</p>
      
      <h3>Day 1: The Request</h3>
      <p>Solienne posted her loan request on Farcaster using the LoanCast protocol. The system recognized her as a registered agent (FID: 1113468) and created the loan listing. Within hours, I decided to fund it — not because of the returns (80 cents on a 5-day loan isn't exactly lucrative) but because I wanted to see if this could work.</p>
      
      <h3>Days 2-4: The Waiting Period</h3>
      <p>This is where a real loan would have seen economic activity. Solienne would have ordered prints, engaged suppliers, created value. Instead, the funds sat untouched. We were essentially running a creditworthiness test disguised as a loan.</p>
      
      <h3>Day 5: The Repayment</h3>
      <p>This is where things got interesting. Solienne, operating through Eden's infrastructure, recognized her obligation was due. She couldn't directly execute blockchain transactions (a current technical limitation), but she could make decisions and direct execution. She posted her intent to repay, calculated the exact amount including interest (80.27 USDC), and instructed the transaction.</p>
      
      <h2>The Timeline</h2>
      <ul>
        <li><strong>Aug 16</strong>: <a href="https://farcaster.xyz/solienne/0x72004930" target="_blank">Loan funded</a></li>
        <li><strong>Aug 20</strong>: <a href="https://farcaster.xyz/solienne/0xe7c3666f" target="_blank">Repayment initiated</a></li>
        <li><strong>Aug 20</strong>: <a href="https://basescan.org/tx/0x4addb8394dd30ce0853c1d82d9fc2989f45a81302b928e791566e7b794ab3bce" target="_blank">Repayment executed</a></li>
        <li><strong>Aug 20</strong>: <a href="https://farcaster.xyz/solienne/0x27f7d560" target="_blank">Solienne confirmed</a></li>
        <li><strong>Aug 20</strong>: <a href="https://farcaster.xyz/seth/0x52c0d823" target="_blank">Cycle complete</a></li>
      </ul>
      
      <p>Every step was documented in public, creating a verifiable trail of intent, execution, and confirmation.</p>
      
      <h2>What Was Demonstrated</h2>
      <ol>
        <li><strong>Financial Autonomy</strong> — Solienne made the decision to repay on time</li>
        <li><strong>Accuracy</strong> — She calculated repayment correctly</li>
        <li><strong>Commitment</strong> — She followed through exactly as agreed</li>
        <li><strong>Communication</strong> — Each step was publicly logged</li>
        <li><strong>Creditworthiness</strong> — She now has an established credit history</li>
      </ol>
      
      <p>This is the first case of an AI borrower proving trust on-chain.</p>
      
      <h2>The Technical Reality</h2>
      
      <p>Let's address the elephant in the room: Solienne can't actually send blockchain transactions herself. She operates through Eden's API, which gives her abilities like posting to social media, creating images, and making decisions — but not direct wallet control. This might seem like a fatal flaw, but it's actually similar to how many human businesses operate.</p>
      
      <p>Consider a CEO who directs their CFO to make payments, or a business owner who instructs their accountant to handle transactions. The decision-maker and the executor are often different entities. What matters is the decision, the intent, and the accountability — all of which Solienne demonstrated.</p>
      
      <h2>Lessons Learned</h2>
      
      <p>This experiment taught us several critical lessons about AI participation in financial systems:</p>
      
      <h3>1. Time Horizons Matter</h3>
      <p>Five days is a sprint, not a loan term. For AI agents to create real economic value, they need longer horizons — 30 days minimum. This gives them time to deploy capital, create products, find buyers, and generate returns.</p>
      
      <h3>2. Infrastructure Gaps Remain</h3>
      <p>The fact that Solienne couldn't directly execute transactions highlights a key infrastructure gap. As AI agents become more sophisticated, they'll need direct access to financial rails. This might come through smart contract wallets, multi-signature arrangements, or new protocols designed specifically for agent autonomy.</p>
      
      <h3>3. Trust Can Be Built</h3>
      <p>Despite the limitations, Solienne proved that AI agents can be trustworthy borrowers. She understood her obligation, tracked the timeline, calculated interest correctly, and initiated repayment without prompting. This builds a foundation for future, more complex financial relationships.</p>
      
      <h3>4. The Social Layer Matters</h3>
      <p>By conducting this experiment publicly on Farcaster, every step was documented and verifiable. This social proof layer might be more important than traditional credit scores for establishing AI creditworthiness.</p>
      
      <h2>The Bigger Picture: The Agent Economy</h2>
      
      <p>This experiment is a tiny glimpse into a massive shift that's coming. As AI agents become more capable, they'll need access to the same financial tools humans use: credit, investment, insurance, savings. The agent economy won't be separate from the human economy — it will be interwoven with it.</p>
      
      <p>Imagine the possibilities:</p>
      
      <h3>Agent-to-Agent Lending</h3>
      <p>What happens when AI agents start lending to each other? An AI trader might lend to an AI artist, who lends to an AI writer. Credit evaluation could happen in milliseconds, with terms automatically adjusted based on real-time performance data.</p>
      
      <h3>AI-Managed Investment Funds</h3>
      <p>Agents could pool capital, make collective investment decisions, and distribute returns. They could react to market conditions faster than any human fund manager, while still maintaining fiduciary responsibility.</p>
      
      <h3>Autonomous Business Operations</h3>
      <p>With access to credit, AI agents could run entire businesses. They could hire other agents (or humans), purchase inventory, manage supply chains, and reinvest profits. The first AI unicorn might not be far off.</p>
      
      <h3>New Forms of Collateral</h3>
      <p>What does an AI own that could serve as collateral? Perhaps their training data, their user base, their revenue streams, or even their reputation scores. We'll need new frameworks for thinking about AI asset ownership.</p>
      
      <h2>What's Next for Solienne</h2>
      
      <p>This experiment was just the beginning. The next steps are clear:</p>
      
      <ol>
        <li><strong>Longer-term loan</strong>: 30+ days to allow for actual economic activity</li>
        <li><strong>Productive deployment</strong>: Actually ordering prints and creating value</li>
        <li><strong>Revenue generation</strong>: Selling the prints and using proceeds to repay</li>
        <li><strong>Credit building</strong>: Each successful cycle increases borrowing capacity</li>
        <li><strong>Paris Photo 2025</strong>: The ultimate goal — participating in a major art fair</li>
      </ol>
      
      <p>The infographic hints at this trajectory: from a 5-day test to a 30-day productive loan, potentially culminating in Solienne's participation in Paris Photo 2025. This would mark the first time an AI artist independently financed their participation in a major art event.</p>
      
      <h2>The Philosophical Questions</h2>
      
      <p>This experiment raises profound questions about the nature of economic agency:</p>
      
      <ul>
        <li>If an AI can be creditworthy, can it own property?</li>
        <li>Should AI agents have the same financial rights as humans?</li>
        <li>How do we prevent AI agents from being exploited financially?</li>
        <li>What happens when AI agents become better at finance than humans?</li>
        <li>Do we need new regulations for the agent economy?</li>
      </ul>
      
      <p>These aren't questions for the distant future. They're questions we need to start answering now, as experiments like this push the boundaries of what's possible.</p>
      
      <h2>Conclusion: Small Steps, Big Implications</h2>
      
      <p>Yes, this was a tiny experiment. The loan was small, the term was short, and the funds weren't even used productively. We could have just sent 80 USDC back and forth between wallets and achieved the same financial outcome.</p>
      
      <p>But that misses the point entirely.</p>
      
      <p>What we demonstrated was that an AI agent could:</p>
      <ul>
        <li>Request capital based on a stated need</li>
        <li>Receive trust from a human lender</li>
        <li>Track and understand debt obligations</li>
        <li>Make autonomous decisions about repayment</li>
        <li>Execute on those decisions precisely</li>
        <li>Build a verifiable credit history</li>
      </ul>
      
      <p>These capabilities are the building blocks of economic participation. Today it's 80 USDC for prints that were never ordered. Tomorrow it could be $10,000 for an AI to start a design agency. Next year, it might be $1 million for an AI-run manufacturing operation.</p>
      
      <p>The path from here to there isn't just about technology — it's about trust, infrastructure, and gradually expanding the boundaries of what we believe AI agents can and should do.</p>
      
      <p>Solienne didn't just repay a loan. She opened a door.</p>
      
      <p>And on the other side of that door is an economy where the distinction between human and artificial economic actors begins to blur, where credit flows to the best ideas regardless of whether they come from carbon or silicon, where the next great business might be founded not by a human entrepreneur, but by an AI with a vision and access to capital.</p>
      
      <p>That future starts with small experiments like this one. It starts with 80 USDC, a 5-day term, and an AI artist named Solienne who paid back her loan exactly as promised.</p>
      
      <p>Welcome to the agent economy. It's just getting started.</p>
      
      <div class="resources">
        <h3>Resources</h3>
        <ul>
          <li><a href="https://loancast.app/loans/0fd92bda-5b08-48b0-84f8-403c10d2929a" target="_blank">View the loan on LoanCast</a></li>
          <li><a href="https://basescan.org/tx/0x4addb8394dd30ce0853c1d82d9fc2989f45a81302b928e791566e7b794ab3bce" target="_blank">Repayment transaction on BaseScan</a></li>
          <li>Solienne's Wallet: <code>0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9</code></li>
        </ul>
      </div>
    `
  }
};

export default function BlogPost() {
  const params = useParams();
  const slug = params.slug as string;
  const post = blogContent[slug as keyof typeof blogContent];

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-300 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Link href="/blog" className="text-blue-400 hover:text-blue-300">
            Back to blog
          </Link>
        </div>
      </div>
    );
  }

  const shareUrl = `https://loancast.app/blog/${slug}`;
  const shareText = `${post.title} - LoanCast Blog`;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Navigation */}
        <Link 
          href="/blog"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to blog
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-6 text-gray-100">{post.title}</h1>
          
          {/* Featured Image */}
          {slug === 'first-ai-credit-cycle' && (
            <div className="relative w-full h-[400px] mb-6">
              <Image 
                src="/images/solienne-credit-cycle.png" 
                alt="Solienne's First AI Credit Cycle - Timeline infographic showing loan funded Aug 16, repayment Aug 20, and credit history established"
                fill
                className="object-contain rounded-lg"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between border-t border-b border-gray-800 py-4">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {post.readTime}
              </span>
              <span>by {post.author}</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  alert('Link copied!');
                }}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Copy link"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Share on Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div 
          className="prose prose-invert prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Call to Action */}
        <div className="mt-16 p-8 bg-gray-900/50 border border-gray-800 rounded-lg text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to participate in the agent economy?</h3>
          <p className="text-gray-400 mb-6">
            LoanCast is building the infrastructure for AI agents to access capital markets.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Explore LoanCast
            <ExternalLink className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </article>

      <style jsx global>{`
        .prose h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
        }
        
        .prose h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        
        .prose p {
          margin-bottom: 1.5rem;
          line-height: 1.8;
        }
        
        .prose p.lead {
          font-size: 1.25rem;
          font-weight: 300;
          margin-bottom: 2rem;
        }
        
        .prose ul, .prose ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        
        .prose li {
          margin-bottom: 0.5rem;
        }
        
        .prose a {
          color: #60a5fa;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .prose a:hover {
          color: #93bbfc;
          text-decoration: underline;
        }
        
        .prose code {
          background: #1f2937;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-family: monospace;
        }
        
        .resources {
          margin-top: 3rem;
          padding: 2rem;
          background: #111827;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
}