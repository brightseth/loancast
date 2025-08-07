import { NextResponse } from 'next/server'
import { rpcClient } from '@/lib/rpc-client'

export async function GET() {
  try {
    const healthResults = await rpcClient.healthCheck()
    
    const healthyCount = healthResults.filter(r => r.healthy).length
    const totalCount = healthResults.length
    const overallHealthy = healthyCount > 0

    return NextResponse.json({
      status: overallHealthy ? 'healthy' : 'unhealthy',
      healthy_rpcs: healthyCount,
      total_rpcs: totalCount,
      rpcs: healthResults,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}