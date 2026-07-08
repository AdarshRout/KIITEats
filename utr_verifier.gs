/**
 * KiitEats UTR Auto-Verifier
 * 
 * This script searches Gmail for recent bank credit alerts, extracts the
 * 12-digit UTR (Transaction ID) and amount, and sends them to the KiitEats backend.
 * 
 * INSTRUCTIONS:
 * 1. Open script.google.com and create a new project called "KiitEats UTR Verifier"
 * 2. Paste this code into Code.gs
 * 3. Update the BACKEND_URL variable to your actual server URL
 * 4. Update the SEARCH_QUERY with your bank's specific email address
 * 5. Run the setupTrigger() function once 
 *    - It will ask for permissions, click "Review Permissions" -> Choose your account -> "Advanced" -> "Go to KiitEats UTR Verifier"
 * 6. The script will now run automatically every 1 minute!
 */

const BACKEND_URL = "https://your-backend-domain.com/payments/auto-verify";
// Change this to match your bank's alert email address (e.g., from:alerts@hdfcbank.net)
const SEARCH_QUERY = "is:unread label:inbox (credited OR received)"; 

/**
 * Main function that runs every minute
 */
function processUnreadBankAlerts() {
  Logger.log("Starting UTR extraction process...");
  
  // Find unread emails matching our query
  const threads = GmailApp.search(SEARCH_QUERY, 0, 10);
  Logger.log(`Found ${threads.length} matching email threads.`);
  
  if (threads.length === 0) return;
  
  const messages = GmailApp.getMessagesForThreads(threads);
  
  for (let i = 0; i < messages.length; i++) {
    for (let j = 0; j < messages[i].length; j++) {
      const msg = messages[i][j];
      
      if (msg.isUnread()) {
        const body = msg.getPlainBody() || msg.getBody();
        const subject = msg.getSubject();
        
        Logger.log(`Processing email: ${subject}`);
        
        // Extract 12-digit UTR
        const utrMatch = extractUTR(body);
        
        // Extract Amount
        const amountMatch = extractAmount(body);
        
        if (utrMatch && amountMatch) {
          Logger.log(`Extracted: UTR=${utrMatch}, Amount=${amountMatch}`);
          
          // Send to backend
          const success = verifyWithBackend(utrMatch, parseFloat(amountMatch));
          
          if (success) {
            // Mark as read only if successfully processed by backend
            // (or if it was a valid UTR but not for our system, to avoid infinite loops)
            msg.markRead();
            Logger.log("Email marked as read.");
          }
        } else {
          Logger.log("Could not find UTR or Amount in this email.");
          // Mark as read anyway so we don't keep reprocessing irrelevant emails
          msg.markRead();
        }
      }
    }
  }
}

/**
 * Extracts a 12 digit number from the string
 * Common formats: UTR: 123456789012, UPI Ref No: 123456789012, etc.
 */
function extractUTR(text) {
  // Look for exact 12 digit sequences, often preceded by specific keywords
  // This regex looks for exactly 12 continuous digits
  const regex = /(?<!\d)(\d{12})(?!\d)/g;
  
  let match;
  let possibleUtrs = [];
  
  while ((match = regex.exec(text)) !== null) {
    possibleUtrs.push(match[1]);
  }
  
  // If we found exactly one 12-digit number, it's highly likely the UTR
  if (possibleUtrs.length === 1) {
    return possibleUtrs[0];
  }
  
  // If there are multiple 12-digit numbers, look for context
  for (let utr of possibleUtrs) {
    // Check if it's near keywords like "UTR", "Ref", "UPI"
    const contextStart = Math.max(0, text.indexOf(utr) - 20);
    const contextStr = text.substring(contextStart, text.indexOf(utr)).toLowerCase();
    
    if (contextStr.includes('utr') || 
        contextStr.includes('ref') || 
        contextStr.includes('txn') || 
        contextStr.includes('upi')) {
      return utr;
    }
  }
  
  // Fallback to the first one found if no context matches
  return possibleUtrs.length > 0 ? possibleUtrs[0] : null;
}

/**
 * Extracts Indian Rupee amount from text
 */
function extractAmount(text) {
  // Looks for Rs. 150.00, INR 150, Rs 150, ₹150 etc.
  const regex = /(?:rs\.?|inr|₹|rs)\s*([0-9,]+(?:\.\d{1,2})?)/i;
  const match = text.match(regex);
  
  if (match && match[1]) {
    // Remove formatting commas
    return match[1].replace(/,/g, '');
  }
  return null;
}

/**
 * Calls the KiitEats backend
 */
function verifyWithBackend(utr, amount) {
  const payload = {
    utr_number: utr,
    amount: amount
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true // Don't crash script on 4xx/5xx errors
  };
  
  try {
    const response = UrlFetchApp.fetch(BACKEND_URL, options);
    const code = response.getResponseCode();
    Logger.log(`Backend response code: ${code}`);
    Logger.log(`Backend response body: ${response.getContentText()}`);
    
    // 200 = Success, 404 = Order not found (might be for something else)
    // We return true for both so we can mark the email as read and stop trying
    return code === 200 || code === 404 || code === 400; 
  } catch (e) {
    Logger.log(`Error calling backend: ${e.message}`);
    return false; // Error connecting, try again next minute
  }
}

/**
 * Setup function - RUN THIS ONCE from the Apps Script Editor
 */
function setupTrigger() {
  // Clear existing triggers to avoid duplicates
  deleteTriggers();
  
  // Create a new time-driven trigger to run every minute
  ScriptApp.newTrigger('processUnreadBankAlerts')
    .timeBased()
    .everyMinutes(1)
    .create();
    
  Logger.log("Trigger successfully created! The script will now run every 1 minute.");
}

/**
 * Helper to delete all triggers for this project
 */
function deleteTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  Logger.log("All existing triggers deleted.");
}
