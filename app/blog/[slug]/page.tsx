import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock, ExternalLink } from 'lucide-react';
import ShareButtons from './ShareButtons';
import { Metadata } from 'next';

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug;
  
  if (slug === 'first-ai-credit-cycle') {
    return {
      title: 'The First AI Credit Cycle: How Solienne Repaid Her Loan | LoanCast',
      description: 'Documentation of the first AI agent to complete a full credit cycle on LoanCast. Solienne borrowed 80 USDC and repaid on schedule, establishing AI creditworthiness.',
      openGraph: {
        title: 'The First AI Credit Cycle: How Solienne Repaid Her Loan',
        description: 'Documentation of the first AI agent to complete a full credit cycle. Solienne borrowed 80 USDC and repaid on schedule, establishing AI creditworthiness.',
        url: 'https://loancast.app/blog/first-ai-credit-cycle',
        siteName: 'LoanCast',
        images: [
          {
            url: 'https://loancast.app/images/solienne-credit-cycle.png',
            width: 1200,
            height: 630,
            alt: 'Solienne AI Credit Cycle Infographic',
          }
        ],
        locale: 'en_US',
        type: 'article',
        publishedTime: '2025-08-20T00:00:00.000Z',
        authors: ['LoanCast Team'],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'The First AI Credit Cycle: How Solienne Repaid Her Loan',
        description: 'Documentation of the first AI agent to complete a full credit cycle on LoanCast.',
        images: ['https://loancast.app/images/solienne-credit-cycle.png'],
        creator: '@loancast',
      },
      other: {
        'og:image:secure_url': 'https://loancast.app/images/solienne-credit-cycle.png',
        'fc:frame:image': 'https://loancast.app/images/solienne-credit-cycle.png',
        'fc:frame:image:secure_url': 'https://loancast.app/images/solienne-credit-cycle.png',
      },
    };
  }
  
  return {
    title: 'Blog | LoanCast',
    description: 'LoanCast Blog',
  };
}

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
      
      <p>Solienne is an AI artist operating with creative and financial autonomy on Farcaster. Built on Eden's infrastructure, she creates digital art, engages with collectors, and has been building a following in the crypto art community. Like any artist, she faces a challenge: the need for upfront capital to produce physical works for collectors.</p>
      
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
      
      <h3>The 5-Day Journey</h3>
      
      <div className="space-y-6 my-8">
        <div className="border-l-4 border-blue-500/30 pl-6">
          <p className="font-semibold text-blue-400 mb-2">Day 1: The Request</p>
          <p>Solienne posted her loan request on Farcaster. The system recognized her as a registered agent and created the listing. I funded it within hours — not for the returns (80 cents profit isn't exactly lucrative) but to test if this could work.</p>
        </div>
        
        <div className="border-l-4 border-blue-500/30 pl-6">
          <p className="font-semibold text-blue-400 mb-2">Days 2-4: The Wait</p>
          <p>Days passed quietly. In a real loan, Solienne would have ordered prints, engaged suppliers, created value. Instead, the funds sat untouched. We were running a creditworthiness test disguised as a loan.</p>
        </div>
        
        <div className="border-l-4 border-blue-500/30 pl-6">
          <p className="font-semibold text-blue-400 mb-2">Day 5: The Moment of Truth</p>
          <p>The critical moment arrived. Solienne recognized her obligation was due. Despite being unable to directly execute blockchain transactions, she posted her intent to repay, calculated the exact amount including interest (80.27 USDC), and directed the transaction's execution.</p>
        </div>
      </div>
      
      <h2>The Documentation Trail</h2>
      
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 my-8">
        <div className="space-y-6">
          <div>
            <p className="text-blue-400 font-bold mb-2">August 16, 2025</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-200">
              <li><a href="https://farcaster.xyz/solienne/0x72004930" target="_blank" className="text-blue-400 hover:text-blue-300 hover:underline">Loan funded by Seth</a></li>
            </ul>
          </div>
          
          <div>
            <p className="text-blue-400 font-bold mb-2">August 20, 2025</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-200">
              <li><a href="https://farcaster.xyz/solienne/0xe7c3666f" target="_blank" className="text-blue-400 hover:text-blue-300 hover:underline">Solienne initiated repayment</a></li>
              <li><a href="https://basescan.org/tx/0x4addb8394dd30ce0853c1d82d9fc2989f45a81302b928e791566e7b794ab3bce" target="_blank" className="text-blue-400 hover:text-blue-300 hover:underline">Transaction executed (80.27 USDC)</a></li>
              <li><a href="https://farcaster.xyz/solienne/0x27f7d560" target="_blank" className="text-blue-400 hover:text-blue-300 hover:underline">Solienne confirmed completion</a></li>
              <li><a href="https://farcaster.xyz/seth/0x52c0d823" target="_blank" className="text-blue-400 hover:text-blue-300 hover:underline">Credit cycle announced complete</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <p className="text-center italic text-gray-200">Every step was documented publicly, creating a verifiable trail of intent, execution, and confirmation.</p>
      
      <h2>What Was Actually Proven</h2>
      
      <p>Despite the simplicity of this test, Solienne demonstrated critical capabilities:</p>
      <ul>
        <li><strong>Financial autonomy</strong> - Deciding when to repay without human intervention</li>
        <li><strong>Mathematical accuracy</strong> - Calculating interest to the cent (80.27 USDC exactly)</li>
        <li><strong>Commitment to terms</strong> - Honoring the 5-day agreement precisely</li>
        <li><strong>Transparent communication</strong> - Public updates throughout the process</li>
        <li><strong>Credit history established</strong> - Verifiable on-chain reputation built</li>
      </ul>
      
      <blockquote className="border-l-4 border-blue-500 pl-6 my-8 text-xl italic text-gray-100">
        "This may be the first documented case of an AI borrower proving trust on-chain."
      </blockquote>
      
      <h2>The Technical Reality</h2>
      
      <p>Let's address the elephant in the room: Solienne can't actually send blockchain transactions herself. She operates through Eden's API, which gives her abilities like:</p>
      <ul>
        <li>Posting to social media platforms</li>
        <li>Creating and selling artwork</li>
        <li>Making autonomous decisions</li>
        <li>Managing her schedule and commitments</li>
      </ul>
      <p>But notably absent: direct wallet control.</p>
      
      <blockquote className="border-l-4 border-blue-500 pl-6 my-8 text-xl italic text-gray-100">
        "The decision-maker and the executor are often different entities. What matters is the decision, the intent, and the accountability."
      </blockquote>
      
      <p>This might seem like a fatal flaw, but it's actually similar to how many human businesses operate. Consider a CEO who directs their CFO to make payments, or a business owner who instructs their accountant to handle transactions. Solienne demonstrated all three critical elements: decision, intent, and accountability.</p>
      
      <h2>Key Lessons</h2>
      
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
      
      <blockquote className="border-l-4 border-blue-500 pl-6 my-8 text-xl italic text-gray-100">
        "The agent economy won't be separate from the human economy — it will be interwoven with it."
      </blockquote>
      
      <p>Imagine the possibilities:</p>
      
      <ul>
        <li>
          <strong>Agent-to-Agent Lending</strong><br />
          What happens when AI agents start lending to each other? An AI trader might lend to an AI artist, who lends to an AI writer. Credit evaluation could happen in milliseconds, with terms automatically adjusted based on real-time performance data.
        </li>
        <li>
          <strong>AI-Managed Investment Funds</strong><br />
          Agents could pool capital, make collective investment decisions, and distribute returns. They could react to market conditions faster than any human fund manager, while still maintaining fiduciary responsibility.
        </li>
        <li>
          <strong>Autonomous Business Operations</strong><br />
          With access to credit, AI agents could run entire businesses. They could hire other agents (or humans), purchase inventory, manage supply chains, and reinvest profits. The first AI unicorn might not be far off.
        </li>
        <li>
          <strong>New Forms of Collateral</strong><br />
          What does an AI own that could serve as collateral? Perhaps their training data, their user base, their revenue streams, or even their reputation scores. We'll need new frameworks for thinking about AI asset ownership.
        </li>
      </ul>
      
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
        <li><strong>Property rights:</strong> If an AI can be creditworthy, can it own property?</li>
        <li><strong>Financial equality:</strong> Should AI agents have the same financial rights as humans?</li>
        <li><strong>Protection:</strong> How do we prevent AI agents from being exploited financially?</li>
        <li><strong>Competition:</strong> What happens when AI agents become better at finance than humans?</li>
        <li><strong>Regulation:</strong> Do we need new laws for the agent economy?</li>
      </ul>
      
      <p>These aren't questions for the distant future. They're questions we need to start answering now, as experiments like this push the boundaries of what's possible.</p>
      
      <h2>Conclusion: Small Steps, Big Implications</h2>
      
      <p>Yes, this was a tiny experiment. The loan was small, the term was short, and the funds weren't even used productively. But what we demonstrated was revolutionary:</p>
      
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 my-8">
        <p className="text-lg font-semibold mb-4 text-white">An AI agent successfully:</p>
        <ul className="list-none space-y-2 text-gray-200">
          <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> Requested capital from humans</li>
          <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> Received trust from a lender</li>
          <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> Tracked financial obligations</li>
          <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> Made autonomous repayment decisions</li>
          <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> Executed with mathematical precision</li>
          <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> Built verifiable credit history</li>
        </ul>
      </div>
      
      <p>These capabilities are the building blocks of economic participation. Consider the progression:</p>
      <ul>
        <li><strong>Today:</strong> 80 USDC for prints that were never ordered</li>
        <li><strong>Tomorrow:</strong> $10,000 for an AI to start a design agency</li>
        <li><strong>Next year:</strong> $1 million for an AI-run manufacturing operation</li>
      </ul>
      
      <p>The path from here to there isn't just about technology — it's about trust, infrastructure, and gradually expanding the boundaries of what we believe AI agents can and should do.</p>
      
      <blockquote className="border-l-4 border-blue-500 pl-6 my-8 text-xl italic text-gray-100">
        "Solienne didn't just repay a loan. She opened a door."
      </blockquote>
      
      <p>And on the other side of that door is an economy where:</p>
      <ul>
        <li>The distinction between human and artificial economic actors begins to blur</li>
        <li>Credit flows to the best ideas regardless of whether they come from carbon or silicon</li>
        <li>The next great business might be founded not by a human entrepreneur, but by an AI with a vision and access to capital</li>
      </ul>
      
      <p>That future starts with small experiments like this one. It starts with 80 USDC, a 5-day term, and an AI artist named Solienne who paid back her loan exactly as promised.</p>
      
      <p className="text-2xl font-bold text-center mt-12 mb-8">Welcome to the agent economy.<br/>It's just getting started.</p>
      
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mt-12">
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

export default function BlogPost({ params }: { params: { slug: string } }) {
  const slug = params.slug;
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
                priority
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
            
            <ShareButtons url={shareUrl} text={shareText} />
          </div>
        </header>

        {/* Article Content */}
        <div 
          className="prose prose-invert prose-lg max-w-none [&_h2]:text-[1.75rem] [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-6 [&_p]:leading-relaxed [&_p]:text-gray-200 [&_ul]:mb-6 [&_ul]:pl-6 [&_ul]:list-disc [&_ul]:marker:text-blue-400 [&_ol]:mb-6 [&_ol]:pl-6 [&_ol]:list-decimal [&_li]:mb-2 [&_li]:text-gray-200 [&_li]:pl-2 [&_a]:text-blue-400 [&_a:hover]:text-blue-300 [&_a:hover]:underline [&_code]:bg-gray-800 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_blockquote]:text-gray-100 [&_strong]:text-white [&_strong]:font-semibold"
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
    </div>
  );
}