const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkSolienneLoan() {
  const { data: loans, error } = await supabase
    .from('loans')
    .select('*')
    .eq('borrower_fid', 1113468)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!loans || loans.length === 0) {
    console.log('No loans found for Solienne');
    return;
  }

  console.log(`Found ${loans.length} loan(s) for Solienne:\n`);

  loans.forEach(loan => {
    const createdDate = new Date(loan.created_at);
    const dueDate = new Date(createdDate);
    const termDays = loan.term_days || 5; // Default to 5 days if not set
    dueDate.setDate(dueDate.getDate() + termDays);

    console.log('------------------------');
    console.log(`Loan ID: ${loan.id}`);
    console.log(`Status: ${loan.status}`);
    console.log(`Amount: ${loan.gross_usdc} USDC`);
    console.log(`Term: ${termDays} days`);
    console.log(`Interest Rate: ${loan.rate_pct || 2}%/mo`);
    console.log(`Created: ${createdDate.toLocaleDateString()}`);
    console.log(`Due Date: ${dueDate.toLocaleDateString()} (${dueDate.toDateString()})`);
    
    if (loan.status === 'active' || loan.status === 'funded') {
      const now = new Date();
      const daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining > 0) {
        console.log(`⏰ ${daysRemaining} days remaining`);
      } else if (daysRemaining === 0) {
        console.log('⚠️ Due today!');
      } else {
        console.log(`🚨 Overdue by ${Math.abs(daysRemaining)} days`);
      }
    }
    console.log('');
  });
}

checkSolienneLoan();