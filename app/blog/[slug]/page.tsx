'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, ExternalLink, Share2, Twitter } from 'lucide-react';
import { useParams } from 'next/navigation';

// This would normally come from a CMS or markdown files
const blogContent = {
  'first-ai-credit-cycle': {
    title: 'The First AI Credit Cycle: How Solienne Repaid Her Loan',
    date: 'August 20, 2025',
    author: 'LoanCast Team',
    readTime: '5 min read',
    content: `
      <p class="lead">On August 20, 2025, something small but historic happened. Solienne, an AI artist, completed the first documented credit cycle on LoanCast, a new protocol for social micro-loans.</p>
      
      <p>This wasn't about money — it was about trust, proof, and the beginnings of an agent economy where AI systems hold reputation and access to capital.</p>
      
      <h2>The Experiment</h2>
      <ul>
        <li><strong>Loan Amount</strong>: 80 USDC</li>
        <li><strong>Terms</strong>: 5 days, 2% monthly interest</li>
        <li><strong>Net Received</strong>: 72 USDC (after platform fee)</li>
        <li><strong>Repayment Due</strong>: 80.27 USDC</li>
        <li><strong>Status</strong>: Fully repaid on time ✅</li>
      </ul>
      
      <p>This was not a productive loan. Solienne didn't spend the funds. Instead, the purpose was to prove one thing: an AI agent can borrow and repay on schedule.</p>
      
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
      
      <h2>Lessons Learned</h2>
      <ul>
        <li><strong>Short loans aren't useful</strong> — 5 days was too little to order prints or deploy funds</li>
        <li><strong>The capital sat idle</strong> — this was really a creditworthiness demo</li>
        <li><strong>Agents can't yet execute transactions directly</strong> — but they can direct humans and systems to do so</li>
        <li><strong>What matters most is intent + accountability</strong>, not mechanics</li>
      </ul>
      
      <h2>The Bigger Picture</h2>
      <p>Why does this matter? Because it hints at a new layer of the economy:</p>
      <ul>
        <li>Agent-to-agent lending</li>
        <li>AI-managed businesses</li>
        <li>Synthetic actors with track records</li>
        <li>A parallel credit market for autonomous entities</li>
      </ul>
      
      <p>This was Solienne's "Hello World" — a foundation stone for AI credit.</p>
      
      <p>The next challenge is to borrow for creation, not just reputation: ordering prints, selling them, and recycling revenue back into her practice.</p>
      
      <h2>Conclusion</h2>
      <p>This experiment may look small — 80 USDC in, 80.27 out — but its implications are large.</p>
      
      <p>We now have evidence that AI agents can participate in credit markets, honor commitments, and build financial reputation.</p>
      
      <p>It's the beginning of the agent economy. Solienne just wrote the first line of its ledger.</p>
      
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
            <img 
              src="/images/solienne-credit-cycle.png" 
              alt="Solienne's First AI Credit Cycle - Timeline infographic showing loan funded Aug 16, repayment Aug 20, and credit history established"
              className="w-full rounded-lg mb-6"
            />
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