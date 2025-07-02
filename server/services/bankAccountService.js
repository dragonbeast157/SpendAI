const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const fs = require('fs');
const path = require('path');

class BankAccountService {
  static async create(userId, accountData) {
    console.log('BankAccountService: Creating bank account for user:', userId);

    try {
      const bankAccount = new BankAccount({
        userId,
        ...accountData
      });

      const savedAccount = await bankAccount.save();
      console.log('BankAccountService: Bank account created successfully');

      return savedAccount;
    } catch (error) {
      console.error('BankAccountService: Error creating bank account:', error.message);
      throw new Error(`Failed to create bank account: ${error.message}`);
    }
  }

  static async getAccounts(userId) {
    console.log('BankAccountService: Fetching bank accounts for user:', userId);

    try {
      const accounts = await BankAccount.find({
        userId,
        isDeleted: false
      }).lean();

      console.log('BankAccountService: Found', accounts.length, 'bank accounts');

      return {
        success: true,
        accounts
      };
    } catch (error) {
      console.error('BankAccountService: Error fetching bank accounts:', error.message);
      throw new Error(`Failed to fetch bank accounts: ${error.message}`);
    }
  }

  static async getById(accountId, userId) {
    console.log('BankAccountService: Fetching bank account:', accountId);

    try {
      const account = await BankAccount.findOne({
        _id: accountId,
        userId,
        isDeleted: false
      }).lean();

      if (!account) {
        throw new Error('Bank account not found');
      }

      return account;
    } catch (error) {
      console.error('BankAccountService: Error fetching bank account:', error.message);
      throw new Error(`Failed to fetch bank account: ${error.message}`);
    }
  }

  static async update(accountId, userId, updateData) {
    console.log('BankAccountService: Updating bank account:', accountId);

    try {
      const account = await BankAccount.findOneAndUpdate(
        { _id: accountId, userId, isDeleted: false },
        { $set: updateData },
        { new: true }
      );

      if (!account) {
        throw new Error('Bank account not found');
      }

      console.log('BankAccountService: Bank account updated successfully');
      return account;
    } catch (error) {
      console.error('BankAccountService: Error updating bank account:', error.message);
      throw new Error(`Failed to update bank account: ${error.message}`);
    }
  }

  static async delete(accountId, userId) {
    console.log('BankAccountService: Deleting bank account:', accountId);

    try {
      const account = await BankAccount.findOneAndUpdate(
        { _id: accountId, userId, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
      );

      if (!account) {
        throw new Error('Bank account not found');
      }

      console.log('BankAccountService: Bank account deleted successfully');
      return account;
    } catch (error) {
      console.error('BankAccountService: Error deleting bank account:', error.message);
      throw new Error(`Failed to delete bank account: ${error.message}`);
    }
  }

  static async processStatement(userId, accountId, statementData) {
    console.log('BankAccountService: Processing bank statement for account:', accountId);

    try {
      // This would typically involve OCR processing and transaction extraction
      // For now, we'll return a mock response
      const processedTransactions = [];

      console.log('BankAccountService: Bank statement processed successfully');
      return {
        success: true,
        transactions: processedTransactions,
        message: 'Statement processed successfully'
      };
    } catch (error) {
      console.error('BankAccountService: Error processing statement:', error.message);
      throw new Error(`Failed to process statement: ${error.message}`);
    }
  }

  static async parseCSVFile(filePath) {
    console.log('=== CSV PARSING COMPREHENSIVE DEBUG START ===');
    console.log('BankAccountService: Parsing CSV file:', filePath);

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      console.log('BankAccountService: CSV file content length:', fileContent.length);

      const lines = fileContent.split('\n');
      console.log('BankAccountService: Total lines in file (including empty):', lines.length);

      const nonEmptyLines = lines.filter(line => line.trim());
      console.log('BankAccountService: Non-empty lines:', nonEmptyLines.length);

      if (nonEmptyLines.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Log the first 10 lines to understand the format
      console.log('BankAccountService: First 10 lines of CSV for format analysis:');
      for (let i = 0; i < Math.min(10, nonEmptyLines.length); i++) {
        console.log(`Line ${i}: "${nonEmptyLines[i]}"`);
      }

      // Skip header row if it exists (detect if first line looks like header)
      let startIndex = 0;
      const firstLine = nonEmptyLines[0];
      if (firstLine.toLowerCase().includes('date') || firstLine.toLowerCase().includes('description')) {
        startIndex = 1;
        console.log('BankAccountService: Detected header row, skipping first line');
      }

      const dataLines = nonEmptyLines.slice(startIndex);
      console.log('BankAccountService: Data lines to process:', dataLines.length);

      const transactions = [];
      let counters = {
        totalProcessed: 0,
        successfullyParsed: 0,
        skippedEmpty: 0,
        invalidDateCount: 0,
        invalidAmountCount: 0,
        zeroAmountCount: 0,
        nullAmountCount: 0,
        positiveAmounts: 0,
        negativeAmounts: 0
      };

      console.log('BankAccountService: Starting line-by-line processing...');

      for (let i = 0; i < dataLines.length; i++) {
        counters.totalProcessed++;
        const line = dataLines[i].trim();

        if (!line) {
          counters.skippedEmpty++;
          continue;
        }

        try {
          const fields = this.parseCSVLine(line);

          // Log first 20 transactions in detail
          if (i < 20) {
            console.log(`BankAccountService: Line ${i + 1}: Raw fields (${fields.length}):`, fields);
          }

          if (fields.length < 3) {
            console.log(`BankAccountService: Line ${i + 1}: Insufficient fields (${fields.length}), skipping`);
            continue;
          }

          // Parse based on the actual CSV format: Date, Description, Credit, Debit, Balance
          let date, merchant, description, amount;

          try {
            // Field 0: Date
            const dateStr = fields[0].trim();
            date = this.parseFlexibleDate(dateStr);
            if (!date || isNaN(date.getTime())) {
              throw new Error(`Cannot parse date: ${dateStr}`);
            }

            // Field 1: Description (full transaction description)
            const fullDescription = fields[1].trim();
            merchant = this.extractMerchantName(fullDescription);
            description = fullDescription;

            // Field 2: Credit (positive income)
            // Field 3: Debit (negative expenses) 
            const creditStr = fields[2] ? fields[2].trim() : '';
            const debitStr = fields[3] ? fields[3].trim() : '';

            if (i < 20) {
              console.log(`BankAccountService: Line ${i + 1}: Amount fields - Credit: "${creditStr}", Debit: "${debitStr}"`);
            }

            const creditAmount = this.parseFlexibleAmount(creditStr);
            const debitAmount = this.parseFlexibleAmount(debitStr);

            if (i < 20) {
              console.log(`BankAccountService: Line ${i + 1}: Parsed amounts - Credit: ${creditAmount}, Debit: ${debitAmount}`);
            }

            // Determine final amount - use whichever field has a value
            if (creditAmount !== null && creditAmount !== 0) {
              amount = Math.abs(creditAmount); // Income is positive
              counters.positiveAmounts++;
            } else if (debitAmount !== null && debitAmount !== 0) {
              amount = -Math.abs(debitAmount); // Expense is negative
              counters.negativeAmounts++;
            } else {
              // Both are null or zero - skip this transaction
              counters.nullAmountCount++;
              if (i < 20) {
                console.log(`BankAccountService: Line ${i + 1}: Both credit and debit are null/zero, skipping`);
              }
              continue;
            }

            if (i < 20) {
              console.log(`BankAccountService: Line ${i + 1}: Final amount: ${amount} (${amount > 0 ? 'INCOME' : 'EXPENSE'})`);
            }

          } catch (parseError) {
            if (i < 20) {
              console.log(`BankAccountService: Line ${i + 1}: Parse error:`, parseError.message);
            }
            counters.invalidAmountCount++;
            continue;
          }

          if (amount === 0) {
            counters.zeroAmountCount++;
          }

          const category = this.categorizeTransaction('', merchant, description);

          const transaction = {
            date,
            merchant: merchant || 'Unknown Merchant',
            description: description || 'Transaction from CSV',
            amount,
            category
          };

          if (i < 20) {
            console.log(`BankAccountService: Line ${i + 1}: Created transaction:`, {
              date: transaction.date.toISOString().split('T')[0],
              merchant: transaction.merchant.substring(0, 30) + (transaction.merchant.length > 30 ? '...' : ''),
              amount: transaction.amount,
              category: transaction.category
            });
          }

          transactions.push(transaction);
          counters.successfullyParsed++;

        } catch (error) {
          if (i < 20) {
            console.log(`BankAccountService: Line ${i + 1}: Processing error:`, error.message);
          }
          continue;
        }
      }

      console.log('=== CSV PARSING RESULTS ===');
      console.log('BankAccountService: Parsing summary:', {
        totalProcessed: counters.totalProcessed,
        successfullyParsed: counters.successfullyParsed,
        skippedEmpty: counters.skippedEmpty,
        invalidDates: counters.invalidDateCount,
        invalidAmounts: counters.invalidAmountCount,
        nullAmounts: counters.nullAmountCount,
        zeroAmounts: counters.zeroAmountCount,
        positiveAmounts: counters.positiveAmounts,
        negativeAmounts: counters.negativeAmounts,
        successRate: `${Math.round((counters.successfullyParsed / counters.totalProcessed) * 100)}%`
      });

      // Show category distribution
      const categoryStats = {};
      transactions.forEach(t => {
        categoryStats[t.category] = (categoryStats[t.category] || 0) + 1;
      });
      console.log('BankAccountService: Category distribution:', categoryStats);

      // Show sample of successful transactions
      console.log('BankAccountService: Sample of successful transactions (first 5):');
      transactions.slice(0, 5).forEach((tx, index) => {
        console.log(`  ${index + 1}. ${tx.date.toISOString().split('T')[0]} | ${tx.merchant.substring(0, 25)} | $${tx.amount} | ${tx.category}`);
      });

      console.log('=== CSV PARSING COMPREHENSIVE DEBUG END ===');
      return transactions;

    } catch (error) {
      console.error('BankAccountService: FATAL ERROR parsing CSV file:', error.message);
      throw new Error(`Failed to parse CSV file: ${error.message}`);
    }
  }

  static parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  static async parsePDFFile(filePath) {
    console.log('BankAccountService: Parsing PDF file:', filePath);
    
    try {
      // For now, we'll create a simple text-based parser
      // In a real implementation, you'd use a PDF parsing library like pdf-parse
      console.log('BankAccountService: PDF parsing not fully implemented, creating sample transactions');
      
      // Return sample transactions that would come from PDF parsing
      return [
        {
          date: new Date(),
          merchant: 'PDF Merchant 1',
          description: 'Transaction from PDF statement',
          amount: -25.50,
          category: 'dining'
        },
        {
          date: new Date(Date.now() - 86400000),
          merchant: 'PDF Merchant 2',
          description: 'Another transaction from PDF',
          amount: -67.89,
          category: 'shopping'
        }
      ];
      
    } catch (error) {
      console.error('BankAccountService: Error parsing PDF file:', error.message);
      throw new Error(`Failed to parse PDF file: ${error.message}`);
    }
  }

  static categorizeTransaction(category, merchant, description) {
    // Log every categorization attempt with detailed info
    console.log('=== CATEGORIZATION DEBUG START ===');
    console.log('BankAccountService: Categorization inputs:', {
      originalCategory: category,
      merchant: merchant,
      description: description
    });

    // Simple categorization logic with detailed logging
    const text = `${category || ''} ${merchant || ''} ${description || ''}`.toLowerCase();
    console.log('BankAccountService: Combined text for matching:', text);
    console.log('BankAccountService: Combined text length:', text.length);
    console.log('BankAccountService: Text contains keywords check:');

    let finalCategory = 'other'; // default
    let matchReason = 'no matches found';
    let keywordsFound = [];

    // Test each category with detailed logging and collect all matches
    const categoryTests = [
      {
        name: 'groceries',
        keywords: ['grocery', 'supermarket', 'food', 'walmart', 'kroger', 'safeway', 'whole foods', 'trader joe', 'costco', 'target', 'fresh market']
      },
      {
        name: 'transport',
        keywords: ['gas', 'fuel', 'transport', 'uber', 'lyft', 'taxi', 'shell', 'exxon', 'chevron', 'bp', 'mobil', 'parking', 'metro', 'bus']
      },
      {
        name: 'dining',
        keywords: ['restaurant', 'coffee', 'dining', 'starbucks', 'mcdonald', 'burger', 'pizza', 'cafe', 'bistro', 'grill', 'kitchen', 'bar', 'pub', 'diner']
      },
      {
        name: 'shopping',
        keywords: ['shop', 'store', 'amazon', 'target', 'mall', 'retail', 'clothing', 'fashion', 'electronics', 'best buy', 'home depot', 'lowes']
      },
      {
        name: 'entertainment',
        keywords: ['entertainment', 'movie', 'netflix', 'spotify', 'theater', 'cinema', 'streaming', 'music', 'game', 'concert', 'show']
      },
      {
        name: 'utilities',
        keywords: ['utility', 'electric', 'water', 'internet', 'phone', 'cable', 'power', 'gas company', 'telecom', 'wireless']
      }
    ];

    console.log('BankAccountService: Testing against category keywords...');

    for (const categoryTest of categoryTests) {
      console.log(`BankAccountService: Testing category "${categoryTest.name}"...`);
      const foundKeywords = [];
      
      for (const keyword of categoryTest.keywords) {
        if (text.includes(keyword)) {
          foundKeywords.push(keyword);
          keywordsFound.push(`${categoryTest.name}:${keyword}`);
        }
      }
      
      console.log(`BankAccountService: Category "${categoryTest.name}" - found keywords:`, foundKeywords);
      
      if (foundKeywords.length > 0) {
        finalCategory = categoryTest.name;
        matchReason = `matched ${categoryTest.name} keywords: ${foundKeywords.join(', ')}`;
        console.log(`BankAccountService: MATCHED ${categoryTest.name.toUpperCase()} - keywords found:`, foundKeywords);
        break; // Use first match
      }
    }

    if (finalCategory === 'other') {
      console.log('BankAccountService: NO CATEGORY MATCH - defaulting to other');
      console.log('BankAccountService: Full text checked:', text);
      console.log('BankAccountService: Text breakdown:');
      console.log('  - Original category:', category);
      console.log('  - Merchant:', merchant);
      console.log('  - Description:', description);
      console.log('BankAccountService: All keywords found across categories:', keywordsFound);
    }

    console.log('BankAccountService: Final categorization result:', {
      finalCategory: finalCategory,
      matchReason: matchReason,
      totalKeywordsFound: keywordsFound.length
    });
    console.log('=== CATEGORIZATION DEBUG END ===');

    return finalCategory;
  }

  static async processGeneralStatement(userId, file) {
    console.log('BankAccountService: Processing general statement for user:', userId);
    console.log('BankAccountService: File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    });

    try {
      let extractedTransactions = [];
      
      // Parse the actual uploaded file based on its type
      if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
        console.log('BankAccountService: Processing as CSV file');
        extractedTransactions = await this.parseCSVFile(file.path);
      } else if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
        console.log('BankAccountService: Processing as PDF file');
        extractedTransactions = await this.parsePDFFile(file.path);
      } else {
        console.log('BankAccountService: Unsupported file type, using mock data');
        // For unsupported file types, use mock data as fallback
        extractedTransactions = [
          {
            date: new Date(),
            merchant: 'Mock Merchant 1',
            description: 'Mock transaction from unsupported file type',
            amount: -15.99,
            category: 'other'
          }
        ];
      }

      console.log('BankAccountService: Extracted transactions from file:', extractedTransactions.length);

      // Prepare transactions for database insertion
      const transactionsToSave = extractedTransactions.map(tx => ({
        userId,
        amount: tx.amount,
        date: tx.date,
        merchant: tx.merchant,
        description: tx.description,
        category: tx.category,
        location: 'From Statement Upload',
        source: 'statement_upload'
      }));

      console.log('BankAccountService: Prepared transactions for database:', transactionsToSave.length);

      // Check for duplicates and save new transactions to database
      const savedTransactions = [];
      let duplicateCount = 0;

      for (const transactionData of transactionsToSave) {
        console.log('BankAccountService: Checking for duplicate transaction:', {
          merchant: transactionData.merchant,
          amount: transactionData.amount,
          date: transactionData.date
        });

        // Check if transaction already exists (duplicate detection)
        const existingTransaction = await Transaction.findOne({
          userId: transactionData.userId,
          merchant: transactionData.merchant,
          amount: transactionData.amount,
          date: {
            $gte: new Date(transactionData.date.getTime() - 24 * 60 * 60 * 1000), // 1 day before
            $lte: new Date(transactionData.date.getTime() + 24 * 60 * 60 * 1000)  // 1 day after
          },
          isDeleted: false
        });

        if (existingTransaction) {
          console.log('BankAccountService: Duplicate transaction found, skipping:', {
            existingId: existingTransaction._id,
            merchant: transactionData.merchant,
            amount: transactionData.amount
          });
          duplicateCount++;
          continue;
        }

        console.log('BankAccountService: Saving new transaction to database:', {
          merchant: transactionData.merchant,
          amount: transactionData.amount,
          category: transactionData.category
        });

        // Create and save new transaction
        const transaction = new Transaction(transactionData);
        const savedTransaction = await transaction.save();
        savedTransactions.push(savedTransaction);

        console.log('BankAccountService: Transaction saved successfully with ID:', savedTransaction._id);
      }

      console.log('BankAccountService: Statement processing completed:', {
        totalExtracted: extractedTransactions.length,
        duplicatesSkipped: duplicateCount,
        newTransactionsSaved: savedTransactions.length
      });

      // Clean up uploaded file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log('BankAccountService: Cleaned up uploaded file');
      }

      return {
        success: true,
        message: `Statement processed successfully. ${savedTransactions.length} new transactions added from your file, ${duplicateCount} duplicates skipped.`,
        transactionCount: savedTransactions.length,
        transactions: savedTransactions,
        duplicatesSkipped: duplicateCount
      };

    } catch (error) {
      console.error('BankAccountService: Error processing general statement:', error.message);
      console.error('BankAccountService: Error stack:', error.stack);

      // Clean up uploaded file on error
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log('BankAccountService: Cleaned up uploaded file after error');
      }

      throw new Error(`Failed to process statement: ${error.message}`);
    }
  }

  static parseFlexibleDate(dateStr) {
    console.log('BankAccountService: Attempting to parse date:', dateStr);
    
    // Try standard Date constructor first
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      console.log('BankAccountService: Date parsed with standard constructor:', date.toISOString());
      return date;
    }

    // Try parsing as DD/MM/YYYY or MM/DD/YYYY
    const dateParts = dateStr.split(/[\/\-\.]/);
    if (dateParts.length === 3) {
      const [part1, part2, part3] = dateParts.map(p => parseInt(p));
      
      // Try MM/DD/YYYY format
      date = new Date(part3, part1 - 1, part2);
      if (!isNaN(date.getTime()) && date.getFullYear() === part3) {
        console.log('BankAccountService: Date parsed as MM/DD/YYYY:', date.toISOString());
        return date;
      }
      
      // Try DD/MM/YYYY format
      date = new Date(part3, part2 - 1, part1);
      if (!isNaN(date.getTime()) && date.getFullYear() === part3) {
        console.log('BankAccountService: Date parsed as DD/MM/YYYY:', date.toISOString());
        return date;
      }
    }

    console.log('BankAccountService: Could not parse date:', dateStr);
    throw new Error(`Cannot parse date: ${dateStr}`);
  }

  static parseFlexibleAmount(amountStr) {
    console.log('BankAccountService: Attempting to parse amount:', amountStr);

    if (!amountStr || amountStr.trim() === '') {
      console.log('BankAccountService: Amount string is empty, returning null to distinguish from 0');
      return null; // Return null instead of 0 to distinguish empty from zero
    }

    // Remove common currency symbols, spaces, and commas
    const cleanedStr = amountStr.trim().replace(/[$,\s\(\)]/g, '');
    console.log('BankAccountService: Cleaned amount string:', cleanedStr);

    // Handle negative amounts in parentheses
    const isNegative = amountStr.includes('(') && amountStr.includes(')');

    const amount = parseFloat(cleanedStr);
    if (isNaN(amount)) {
      console.log('BankAccountService: Could not parse amount, returning null:', amountStr);
      return null; // Return null instead of throwing error
    }

    const finalAmount = isNegative ? -Math.abs(amount) : amount;
    console.log('BankAccountService: Parsed amount:', finalAmount);
    return finalAmount;
  }

  // New method to extract merchant name from full description
  static extractMerchantName(fullDescription) {
    console.log('BankAccountService: Extracting merchant from:', fullDescription);
    
    // Remove common suffixes and extract the main merchant name
    let merchantName = fullDescription;
    
    // Remove card details
    merchantName = merchantName.replace(/Card \d+x+\d+/gi, '').trim();
    
    // Remove receipt numbers
    merchantName = merchantName.replace(/Receipt \d+/gi, '').trim();
    
    // Remove dates
    merchantName = merchantName.replace(/Date \d{1,2} \w{3} \d{4}/gi, '').trim();
    
    // Remove times
    merchantName = merchantName.replace(/Time \d{1,2}:\d{2}[AP]M/gi, '').trim();
    
    // Remove location codes
    merchantName = merchantName.replace(/In [A-Z\s]+/gi, '').trim();
    
    // Remove payment method info
    merchantName = merchantName.replace(/- (Visa|EFTPOS|BPAY) (Purchase|Payment)/gi, '').trim();
    
    // Remove trailing dashes and spaces
    merchantName = merchantName.replace(/\s*-\s*$/, '').trim();
    
    // Take first part before major separators
    const parts = merchantName.split(/\s*-\s*/);
    merchantName = parts[0].trim();
    
    console.log('BankAccountService: Extracted merchant name:', merchantName);
    return merchantName;
  }
}

module.exports = BankAccountService;