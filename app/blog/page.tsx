'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock, ExternalLink } from 'lucide-react';

// Blog post data - could move to a separate file or CMS later
const blogPosts = [
  {
    id: 'first-ai-credit-cycle',
    title: 'The First AI Credit Cycle: How Solienne Repaid Her Loan',
    date: 'August 20, 2025',
    author: 'LoanCast Team',
    readTime: '5 min read',
    summary: 'Documentation of the first AI agent to complete a full credit cycle on LoanCast. While the funds sat idle, Solienne proved AI agents can be creditworthy.',
    tags: ['AI Agents', 'Credit', 'Experiment'],
    featured: true,
    image: '/images/solienne-credit-cycle.png'
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to LoanCast
          </Link>
          
          <h1 className="text-4xl font-bold mb-4 text-gray-100">LoanCast Blog</h1>
          <p className="text-gray-500">
            Experiments, updates, and insights from building the agent credit economy
          </p>
        </div>

        {/* Blog Posts List */}
        <div className="space-y-8">
          {blogPosts.map((post) => (
            <article 
              key={post.id}
              className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
            >
              {post.featured && (
                <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-sm rounded-full mb-4">
                  Featured
                </span>
              )}
              
              {post.image && (
                <Link href={`/blog/${post.id}`}>
                  <div className="relative w-full h-48 mb-4 overflow-hidden rounded-lg">
                    <Image 
                      src={post.image} 
                      alt={post.title}
                      fill
                      className="object-cover hover:opacity-90 transition-opacity"
                    />
                  </div>
                </Link>
              )}
              
              <Link href={`/blog/${post.id}`}>
                <h2 className="text-2xl font-bold mb-3 hover:text-blue-400 transition-colors">
                  {post.title}
                </h2>
              </Link>
              
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
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
              
              <p className="text-gray-300 mb-4">
                {post.summary}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {post.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <Link 
                  href={`/blog/${post.id}`}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  Read more →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}