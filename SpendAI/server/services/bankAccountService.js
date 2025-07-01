const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

class BankAccountService {

  // Get all bank accounts for a user
  static async getByUserId(userId) {
    try {
      console.log('BankAccountService: Fetching bank accounts for user:', userId);
      const accounts = await BankAccount.find({ userId }).sort({ createdAt: -1 });
      console.log('BankAccountService: Found', accounts.length, 'bank accounts');
      return accounts;
    } catch (error) {
      console.error('BankAccountService: Error fetching bank accounts:', error.message);
      throw new Error('Failed to fetch bank accounts');
    }
  }

  // Get all bank accounts for a user (alias method for export functionality)
  static async getAccounts(userId) {
    try {
      console.log('BankAccountService: Fetching accounts for user via getAccounts method:', userId);
      const accounts = await this.getByUserId(userId);
      return { accounts };
    } catch (error) {
      console.error('BankAccountService: Error in getAccounts method:', error.message);
      throw error;
    }
  }

  // Alternative method name for backwards compatibility
  static async getUserAccounts(userId) {
    try {
      console.log('BankAccountService: Fetching accounts for user via getUserAccounts method:', userId);
      const accounts = await this.getByUserId(userId);
      return { accounts };
    } catch (error) {
      console.error('BankAccountService: Error in getUserAccounts method:', error.message);
      throw error;
    }
  }

  // Alternative method name for backwards compatibility
  static async findByUserId(userId) {
    try {
      console.log('BankAccountService: Fetching accounts for user via findByUserId method:', userId);
      const accounts = await this.getByUserId(userId);
      return accounts;
    } catch (error) {
      console.error('BankAccountService: Error in findByUserId method:', error.message);
      throw error;
    }
  }

  // Create a new bank account connection
  static async create(userId, accountData) {
    try {
      console.log('BankAccountService: Creating bank account for user:', userId);
      console.log('BankAccountService: Account data:', { ...accountData, credentials: '[HIDDEN]' });

      // In a real implementation, you would:
      // 1. Validate credentials with the actual bank API
      // 2. Encrypt the credentials properly
      // 3. Fetch actual account details

      // For demo purposes, we'll simulate the connection
      const encryptedPassword = this.encryptPassword(accountData.credentials?.password || '');

      const bankAccount = new BankAccount({
        userId,
        bankName: accountData.bankName,
        accountNumber: accountData.accountNumber,
        accountType: accountData.accountType || 'personal',
        balance: accountData.balance || 0,
        currency: accountData.currency || 'USD',
        status: 'connected', // In real implementation, this would be 'pending' initially
        credentials: {
          username: accountData.credentials?.username,
          encryptedPassword: encryptedPassword
        },
        routingNumber: accountData.routingNumber,
        institutionId: accountData.institutionId,
        logo: accountData.logo,
        lastSync: new Date(),
        syncStatus: 'success'
      });

      const savedAccount = await bankAccount.save();
      console.log('BankAccountService: Bank account created successfully:', savedAccount._id);

      // Remove sensitive data from response
      const responseAccount = savedAccount.toObject();
      delete responseAccount.credentials;

      return responseAccount;
    } catch (error) {
      console.error('BankAccountService: Error creating bank account:', error.message);
      throw new Error('Failed to create bank account connection');
    }
  }

  // Get single bank account by ID
  static async getById(accountId, userId) {
    try {
      console.log('BankAccountService: Fetching bank account:', accountId, 'for user:', userId);
      const account = await BankAccount.findOne({ _id: accountId, userId });

      if (!account) {
        throw new Error('Bank account not found');
      }

      const responseAccount = account.toObject();
      delete responseAccount.credentials;

      return responseAccount;
    } catch (error) {
      console.error('BankAccountService: Error fetching bank account:', error.message);
      throw new Error('Failed to fetch bank account');
    }
  }

  // Update bank account
  static async update(accountId, userId, updateData) {
    try {
      console.log('BankAccountService: Updating bank account:', accountId);

      const account = await BankAccount.findOneAndUpdate(
        { _id: accountId, userId },
        updateData,
        { new: true }
      );

      if (!account) {
        throw new Error('Bank account not found');
      }

      const responseAccount = account.toObject();
      delete responseAccount.credentials;

      console.log('BankAccountService: Bank account updated successfully');
      return responseAccount;
    } catch (error) {
      console.error('BankAccountService: Error updating bank account:', error.message);
      throw new Error('Failed to update bank account');
    }
  }

  // Delete/disconnect bank account
  static async delete(accountId, userId) {
    try {
      console.log('BankAccountService: Deleting bank account:', accountId);

      const account = await BankAccount.findOneAndDelete({ _id: accountId, userId });

      if (!account) {
        throw new Error('Bank account not found');
      }

      console.log('BankAccountService: Bank account deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('BankAccountService: Error deleting bank account:', error.message);
      throw new Error('Failed to delete bank account');
    }
  }

  // Process uploaded bank statement
  static async processStatement(accountId, userId, fileBuffer, fileName) {
    try {
      console.log('BankAccountService: Processing statement for account:', accountId);
      console.log('BankAccountService: File name:', fileName);

      // Verify account exists
      const account = await BankAccount.findOne({ _id: accountId, userId });
      if (!account) {
        throw new Error('Bank account not found');
      }

      // Process the file based on type
      let parsedTransactions = [];
      if (fileName.toLowerCase().endsWith('.csv')) {
        parsedTransactions = await this.processCsvStatement(fileBuffer);
      } else if (fileName.toLowerCase().endsWith('.pdf')) {
        parsedTransactions = await this.processPdfStatement(fileBuffer);
      } else {
        throw new Error('Unsupported file format. Please upload CSV or PDF files.');
      }

      console.log('BankAccountService: Parsed', parsedTransactions.length, 'transactions from statement');

      // Get existing transactions for duplicate detection
      const existingTransactions = await Transaction.find({ 
        userId: userId, 
        bankAccountId: accountId 
      });

      console.log('BankAccountService: Found', existingTransactions.length, 'existing transactions for duplicate check');

      // Create Transaction records in the database
      const createdTransactions = [];
      let duplicateCount = 0;

      for (const parsedTx of parsedTransactions) {
        try {
          console.log('BankAccountService: Processing transaction:', parsedTx);

          // Check for duplicates based on date, amount, and description
          const isDuplicate = existingTransactions.some(existing => {
            const sameDate = new Date(existing.date).toDateString() === parsedTx.date.toDateString();
            const sameAmount = Math.abs(existing.amount - parsedTx.amount) < 0.01; // Allow for small rounding differences
            const sameDescription = existing.description === parsedTx.description || 
                                  existing.merchant === parsedTx.description ||
                                  existing.originalDescription === parsedTx.description;
            
            return sameDate && sameAmount && sameDescription;
          });

          if (isDuplicate) {
            console.log('BankAccountService: Skipping duplicate transaction:', parsedTx);
            duplicateCount++;
            continue;
          }

          // Map parsed transaction to Transaction model format
          const transactionData = {
            userId: userId,
            bankAccountId: accountId,
            amount: parsedTx.amount,
            date: parsedTx.date,
            merchant: parsedTx.description || 'Unknown Merchant',
            description: parsedTx.description || 'Bank Statement Transaction',
            category: this.mapCategoryFromDescription(parsedTx.category || parsedTx.description),
            location: 'Unknown',
            transactionType: parsedTx.amount < 0 ? 'debit' : 'credit',
            originalDescription: parsedTx.description
          };

          const transaction = new Transaction(transactionData);
          const savedTransaction = await transaction.save();
          createdTransactions.push(savedTransaction);

          console.log('BankAccountService: Transaction created successfully:', savedTransaction._id);
        } catch (txError) {
          console.error('BankAccountService: Error creating transaction:', txError.message);
          // Continue with other transactions even if one fails
        }
      }

      // Update account with statement info
      await BankAccount.findByIdAndUpdate(accountId, {
        lastStatementUpload: new Date(),
        $inc: { statementCount: 1 }
      });

      console.log('BankAccountService: Statement processed successfully');
      console.log('BankAccountService: Created', createdTransactions.length, 'new transactions');
      console.log('BankAccountService: Skipped', duplicateCount, 'duplicate transactions');

      return {
        success: true,
        transactionCount: createdTransactions.length,
        duplicateCount: duplicateCount,
        transactions: createdTransactions
      };
    } catch (error) {
      console.error('BankAccountService: Error processing statement:', error.message);
      throw new Error(`Failed to process statement: ${error.message}`);
    }
  }

  // Helper method to parse date in DD/MM/YYYY format
  static parseDate(dateString) {
    try {
      console.log('BankAccountService: Parsing date:', dateString);
      
      // Handle DD/MM/YYYY format
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript Date
          const year = parseInt(parts[2], 10);
          
          const parsedDate = new Date(year, month, day);
          console.log('BankAccountService: Parsed date result:', parsedDate);
          return parsedDate;
        }
      }
      
      // Fallback to default Date parsing
      const fallbackDate = new Date(dateString);
      console.log('BankAccountService: Fallback date result:', fallbackDate);
      return fallbackDate;
    } catch (error) {
      console.error('BankAccountService: Error parsing date:', dateString, error.message);
      return new Date(); // Return current date as fallback
    }
  }

  // Helper method to map category from description
  static mapCategoryFromDescription(description) {
    if (!description) return 'other';

    const desc = description.toLowerCase();

    if (desc.includes('restaurant') || desc.includes('food') || desc.includes('dining') || desc.includes('cafe') || desc.includes('coffee')) {
      return 'dining';
    } else if (desc.includes('gas') || desc.includes('uber') || desc.includes('transport') || desc.includes('parking')) {
      return 'transport';
    } else if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('coles') || desc.includes('woolworths')) {
      return 'groceries';
    } else if (desc.includes('shop') || desc.includes('store') || desc.includes('amazon') || desc.includes('kmart')) {
      return 'shopping';
    } else if (desc.includes('entertainment') || desc.includes('movie') || desc.includes('music') || desc.includes('netflix') || desc.includes('steam')) {
      return 'entertainment';
    } else if (desc.includes('health') || desc.includes('medical') || desc.includes('pharmacy') || desc.includes('chemist')) {
      return 'healthcare';
    } else if (desc.includes('utility') || desc.includes('electric') || desc.includes('water')) {
      return 'utilities';
    }

    return 'other';
  }

  // Helper method to encrypt password (updated implementation)
  static encryptPassword(password) {
    try {
      // In production, use proper encryption like AES-256-GCM
      const algorithm = 'aes-256-cbc';
      const key = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'default-key').digest();
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(password, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Prepend IV to encrypted data
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('BankAccountService: Error encrypting password:', error.message);
      throw new Error('Failed to encrypt password');
    }
  }

  // Process CSV statement
  static async processCsvStatement(fileBuffer) {
    try {
      const csvData = fileBuffer.toString('utf8');
      const lines = csvData.split('\n');
      const transactions = [];

      console.log('BankAccountService: Processing CSV with', lines.length, 'lines');

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(',');
        console.log('BankAccountService: Raw CSV columns:', columns);
        
        if (columns.length >= 4) {
          // Clean up the columns by removing quotes
          const cleanColumns = columns.map(col => col.replace(/"/g, '').trim());
          console.log('BankAccountService: Clean CSV columns:', cleanColumns);

          // Parse the transaction based on the actual CSV format
          // From the logs, it appears the format is: date, description, category, amount
          const dateStr = cleanColumns[0];
          const description = cleanColumns[1];
          const categoryOrAmount = cleanColumns[2];
          const amountOrCategory = cleanColumns[3];

          // Determine which column contains the amount (starts with - or is a number)
          let amount, category;
          if (categoryOrAmount.startsWith('-') || !isNaN(parseFloat(categoryOrAmount))) {
            amount = parseFloat(categoryOrAmount) || 0;
            category = amountOrCategory || 'Other';
          } else {
            amount = parseFloat(amountOrCategory) || 0;
            category = categoryOrAmount || 'Other';
          }

          const transaction = {
            date: this.parseDate(dateStr),
            description: description,
            amount: amount,
            category: category
          };

          console.log('BankAccountService: Parsed CSV transaction:', transaction);
          transactions.push(transaction);
        } else {
          console.log('BankAccountService: Skipping line with insufficient columns:', columns.length);
        }
      }

      console.log('BankAccountService: Successfully parsed', transactions.length, 'transactions from CSV');
      return transactions;
    } catch (error) {
      console.error('BankAccountService: Error processing CSV:', error.message);
      throw new Error('Failed to process CSV file');
    }
  }

  // Process PDF statement (basic implementation)
  static async processPdfStatement(fileBuffer) {
    try {
      // In a real implementation, you would use a PDF parsing library
      // For demo purposes, return mock data
      console.log('BankAccountService: Processing PDF statement (mock implementation)');

      const mockTransactions = [
        {
          date: new Date('2024-01-15'),
          description: 'Starbucks Coffee',
          amount: -25.50,
          category: 'Dining'
        },
        {
          date: new Date('2024-01-14'),
          description: 'Uber Ride',
          amount: -15.75,
          category: 'Transport'
        },
        {
          date: new Date('2024-01-13'),
          description: 'Amazon Purchase',
          amount: -45.00,
          category: 'Shopping'
        },
        {
          date: new Date('2024-01-12'),
          description: 'Whole Foods',
          amount: -89.32,
          category: 'Groceries'
        },
        {
          date: new Date('2024-01-11'),
          description: 'Netflix Subscription',
          amount: -15.99,
          category: 'Entertainment'
        }
      ];

      console.log('BankAccountService: Generated', mockTransactions.length, 'mock transactions from PDF');
      return mockTransactions;
    } catch (error) {
      console.error('BankAccountService: Error processing PDF:', error.message);
      throw new Error('Failed to process PDF file');
    }
  }
}

module.exports = BankAccountService;