import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase"

const Params = z.object({ fid: z.string().regex(/^\d+$/) })

export async function GET(request: Request, { params }: { params: unknown }) {
  try {
    const { fid } = Params.parse(params)
    
    // Try to get existing stats first
    let { data, error } = await supabaseAdmin
      .from("borrower_stats")
      .select("*")
      .eq("fid", Number(fid))
      .single()
    
    // If no stats exist, compute them
    if (error?.code === 'PGRST116') {
      // Call recompute function to create stats
      await supabaseAdmin.rpc('recompute_borrower_stats', { p_fid: Number(fid) })
      
      // Try again
      const result = await supabaseAdmin
        .from("borrower_stats")
        .select("*")
        .eq("fid", Number(fid))
        .single()
        
      data = result.data
      error = result.error
    }
    
    if (error) {
      console.error('Borrower stats error:', error)
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return Response.json(data, { 
      headers: { 
        "Cache-Control": "s-maxage=60",
        'Content-Type': 'application/json'
      } 
    })
    
  } catch (error) {
    console.error('API error:', error)
    return new Response(JSON.stringify({ error: 'Invalid request' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}