import { createPublicClient, http, HttpTransport, PublicClient } from 'viem'
import { base } from 'viem/chains'

// RPC endpoints in order of preference
const RPC_ENDPOINTS = [
  process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  'https://base-mainnet.public.blastapi.io',
  'https://base.gateway.tenderly.co',
  'https://base-rpc.publicnode.com',
  'https://1rpc.io/base'
].filter(Boolean)

const RPC_TIMEOUT = 5000 // 5 second timeout per request

interface RpcClientConfig {
  maxRetries?: number
  timeoutMs?: number
}

class MultiRpcClient {
  private clients: PublicClient[]
  private currentIndex: number = 0
  private maxRetries: number
  private timeoutMs: number

  constructor(config: RpcClientConfig = {}) {
    this.maxRetries = config.maxRetries || RPC_ENDPOINTS.length * 2
    this.timeoutMs = config.timeoutMs || RPC_TIMEOUT

    this.clients = RPC_ENDPOINTS.map(url => 
      createPublicClient({
        chain: base,
        transport: http(url, {
          timeout: this.timeoutMs,
          retryCount: 1,
          retryDelay: 1000
        })
      })
    )
  }

  private async executeWithFailover<T>(
    operation: (client: PublicClient) => Promise<T>,
    operationName: string = 'RPC call'
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const clientIndex = (this.currentIndex + attempt) % this.clients.length
      const client = this.clients[clientIndex]
      const rpcUrl = RPC_ENDPOINTS[clientIndex]

      try {
        console.log(`${operationName}: Attempting RPC ${clientIndex + 1}/${this.clients.length} (${rpcUrl})`)
        
        const result = await Promise.race([
          operation(client),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('RPC timeout')), this.timeoutMs)
          )
        ])

        // Success - update current index for next request
        this.currentIndex = clientIndex
        console.log(`${operationName}: Success with RPC ${clientIndex + 1} (${rpcUrl})`)
        return result

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.warn(`${operationName}: RPC ${clientIndex + 1} failed (${rpcUrl}):`, lastError.message)
        
        // If this was a timeout or network error, try next RPC
        if (this.isNetworkError(lastError)) {
          continue
        }
        
        // For application errors (like invalid block number), don't retry
        throw lastError
      }
    }

    // All RPCs failed
    throw new Error(`All RPC endpoints failed. Last error: ${lastError?.message}`)
  }

  private isNetworkError(error: Error): boolean {
    const networkErrorPatterns = [
      'timeout',
      'network error',
      'connection',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'fetch failed',
      'Internal JSON-RPC error',
      'Too Many Requests'
    ]
    
    return networkErrorPatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  // Wrap common viem methods with failover
  async getBlockNumber(): Promise<bigint> {
    return this.executeWithFailover(
      client => client.getBlockNumber(),
      'getBlockNumber'
    )
  }

  async getTransactionReceipt(hash: `0x${string}`) {
    return this.executeWithFailover(
      client => client.getTransactionReceipt({ hash }),
      'getTransactionReceipt'
    )
  }

  async getBlock(args: { blockNumber: bigint }) {
    return this.executeWithFailover(
      client => client.getBlock(args),
      'getBlock'
    )
  }

  async getTransaction(hash: `0x${string}`) {
    return this.executeWithFailover(
      client => client.getTransaction({ hash }),
      'getTransaction'
    )
  }

  // Get the current primary client for advanced operations
  getCurrentClient(): PublicClient {
    return this.clients[this.currentIndex]
  }

  // Health check all RPCs
  async healthCheck(): Promise<{ url: string; healthy: boolean; latency?: number }[]> {
    const results = await Promise.allSettled(
      RPC_ENDPOINTS.map(async (url, index) => {
        const start = Date.now()
        try {
          await this.clients[index].getBlockNumber()
          return {
            url,
            healthy: true,
            latency: Date.now() - start
          }
        } catch (error) {
          return {
            url,
            healthy: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )

    return results.map((result, index) => ({
      url: RPC_ENDPOINTS[index],
      healthy: result.status === 'fulfilled' ? result.value.healthy : false,
      latency: result.status === 'fulfilled' ? result.value.latency : undefined
    }))
  }
}

// Export singleton instance
export const rpcClient = new MultiRpcClient()

// Export for direct use if needed
export { MultiRpcClient }

// Export type for external use
export type { RpcClientConfig }