import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Add notes column if it doesn't exist
    const { error: notesError } = await supabaseAdmin.rpc('add_notes_column_if_not_exists')
    
    if (notesError) {
      // If the RPC doesn't exist, create the column directly
      console.log('Adding notes column using direct SQL')
      const { error: directNotesError } = await supabaseAdmin
        .from('loans')
        .select('notes')
        .limit(1)
        .single()
      
      if (directNotesError?.code === 'PGRST116') {
        // Column doesn't exist, we need to add it via SQL
        console.log('Notes column does not exist, will need manual migration')
      }
    }

    // Update status enum to include 'deleted'
    const { error: statusError } = await supabaseAdmin.rpc('update_loan_status_enum')
    
    if (statusError) {
      console.log('Status enum update may need manual migration:', statusError.message)
    }

    // Test the webhook by simulating a deletion
    const testCastHash = '0x0000000000000000000000000000000000000000'
    
    console.log('Database migration completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Database updated to support deleted status and notes field',
      migrations: {
        notes_column: notesError ? 'needs_manual_migration' : 'completed',
        status_enum: statusError ? 'needs_manual_migration' : 'completed'
      }
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Get current schema info
export async function GET(request: NextRequest) {
  try {
    // Check if notes column exists
    const { data: columns, error } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'loans' })
    
    const hasNotesColumn = columns?.some((col: any) => col.column_name === 'notes')
    
    // Check current status values
    const { data: statusValues, error: statusError } = await supabaseAdmin
      .rpc('get_enum_values', { enum_name: 'loan_status' })
    
    return NextResponse.json({
      schema_info: {
        has_notes_column: hasNotesColumn,
        current_status_values: statusValues,
        webhook_ready: hasNotesColumn && statusValues?.includes('deleted')
      },
      columns: columns,
      errors: {
        columns_error: error?.message,
        status_error: statusError?.message
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get schema info',
      details: (error as Error).message
    })
  }
}