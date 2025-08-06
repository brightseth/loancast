import { supabaseAdmin } from './supabase'

export interface DatabaseStats {
  tableSize: {
    loans: number
    users: number
    repayments: number
  }
  indexUsage: {
    name: string
    schemaname: string
    tablename: string
    attname: string
    n_distinct: number
    correlation: number
  }[]
  slowQueries: {
    query: string
    calls: number
    total_time: number
    mean_time: number
    rows: number
    hit_percent: number
  }[]
}

export interface QueryPerformance {
  query: string
  executionTime: number
  rowsReturned: number
  indexesUsed: string[]
}

/**
 * Get current database performance statistics
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  try {
    // Get table sizes
    const { data: tableSizes } = await supabaseAdmin.rpc('get_table_sizes')
    
    // Get index usage statistics
    const { data: indexStats } = await supabaseAdmin.rpc('get_index_usage')
    
    // Get slow queries (requires pg_stat_statements extension)
    const { data: slowQueries } = await supabaseAdmin
      .from('slow_queries')
      .select('*')
      .limit(10)

    return {
      tableSize: {
        loans: tableSizes?.find((t: any) => t.table_name === 'loans')?.size_bytes || 0,
        users: tableSizes?.find((t: any) => t.table_name === 'users')?.size_bytes || 0,
        repayments: tableSizes?.find((t: any) => t.table_name === 'repayments')?.size_bytes || 0,
      },
      indexUsage: indexStats || [],
      slowQueries: slowQueries || []
    }
  } catch (error) {
    console.error('Error getting database stats:', error)
    throw error
  }
}

/**
 * Refresh materialized view for platform statistics
 */
export async function refreshPlatformStats(): Promise<void> {
  try {
    await supabaseAdmin.rpc('refresh_platform_stats')
  } catch (error) {
    console.error('Error refreshing platform stats:', error)
    throw error
  }
}

/**
 * Get optimized loan list using the database function
 */
export async function getOptimizedLoans(params: {
  status?: string
  borrowerFid?: number
  lenderFid?: number
  limit?: number
  offset?: number
}) {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_filtered_loans', {
      p_status: params.status || null,
      p_borrower_fid: params.borrowerFid || null,
      p_lender_fid: params.lenderFid || null,
      p_limit: params.limit || 50,
      p_offset: params.offset || 0
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting optimized loans:', error)
    throw error
  }
}

/**
 * Get user loan summary using optimized function
 */
export async function getUserLoanSummary(userFid: number) {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_user_loan_summary', {
      user_fid: userFid
    })

    if (error) throw error
    return data?.[0] || {
      total_loans: 0,
      active_loans: 0,
      repaid_loans: 0,
      total_borrowed: 0,
      avg_loan_size: 0,
      repayment_rate: 0
    }
  } catch (error) {
    console.error('Error getting user loan summary:', error)
    throw error
  }
}

/**
 * Get platform statistics from materialized view
 */
export async function getPlatformStats() {
  try {
    const { data, error } = await supabaseAdmin
      .from('platform_stats')
      .select('*')
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting platform stats:', error)
    throw error
  }
}

/**
 * Analyze query performance for debugging
 */
export async function analyzeQuery(query: string, params?: any[]): Promise<QueryPerformance> {
  const startTime = Date.now()
  
  try {
    // Execute query with EXPLAIN ANALYZE
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`
    
    const { data, error } = await supabaseAdmin.rpc('execute_explain', {
      query: explainQuery,
      params: params || []
    })

    if (error) throw error

    const executionTime = Date.now() - startTime
    const planData = data?.[0]?.['Plan'] || {}
    
    return {
      query,
      executionTime,
      rowsReturned: planData['Actual Rows'] || 0,
      indexesUsed: extractIndexesFromPlan(planData)
    }
  } catch (error) {
    console.error('Error analyzing query:', error)
    return {
      query,
      executionTime: Date.now() - startTime,
      rowsReturned: 0,
      indexesUsed: []
    }
  }
}

/**
 * Extract index names from query execution plan
 */
function extractIndexesFromPlan(plan: any): string[] {
  const indexes: string[] = []
  
  function traverse(node: any) {
    if (node['Node Type'] === 'Index Scan' || node['Node Type'] === 'Index Only Scan') {
      if (node['Index Name']) {
        indexes.push(node['Index Name'])
      }
    }
    
    if (node['Plans']) {
      node['Plans'].forEach(traverse)
    }
  }
  
  traverse(plan)
  return indexes
}

/**
 * Database health check
 */
export async function performHealthCheck() {
  try {
    const checks = await Promise.allSettled([
      // Check if all tables exist
      supabaseAdmin.from('loans').select('count', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('count', { count: 'exact', head: true }),
      supabaseAdmin.from('repayments').select('count', { count: 'exact', head: true }),
      
      // Check if materialized view exists
      supabaseAdmin.from('platform_stats').select('*').single(),
      
      // Test a complex query performance
      supabaseAdmin.rpc('get_user_loan_summary', { user_fid: 1 })
    ])

    const results = {
      tablesAccessible: checks.slice(0, 3).every(result => result.status === 'fulfilled'),
      materializedViewWorking: checks[3].status === 'fulfilled',
      functionsWorking: checks[4].status === 'fulfilled',
      overallHealth: checks.every(result => result.status === 'fulfilled') ? 'healthy' : 'degraded'
    }

    return results
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      tablesAccessible: false,
      materializedViewWorking: false,
      functionsWorking: false,
      overallHealth: 'unhealthy' as const
    }
  }
}

/**
 * Maintenance operations
 */
export async function performMaintenance() {
  try {
    const operations = await Promise.allSettled([
      // Refresh materialized view
      refreshPlatformStats(),
      
      // Update table statistics
      supabaseAdmin.rpc('update_table_stats'),
      
      // Clean up old data if needed
      supabaseAdmin
        .from('repayments')
        .delete()
        .lt('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()) // Remove data older than 1 year
    ])

    return {
      materializedViewRefreshed: operations[0].status === 'fulfilled',
      statisticsUpdated: operations[1].status === 'fulfilled', 
      oldDataCleaned: operations[2].status === 'fulfilled'
    }
  } catch (error) {
    console.error('Database maintenance failed:', error)
    throw error
  }
}