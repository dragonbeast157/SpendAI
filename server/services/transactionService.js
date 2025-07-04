const Transaction = require('../models/Transaction');
const PolicyService = require('./policyService');

class TransactionService {

  static async getTransactions(userId, filters = {}) {
    console.log('=== TRANSACTION SERVICE DEBUG ENHANCED START ===');
    console.log('TransactionService: Fetching transactions for user:', userId);
    console.log('TransactionService: Filters received:', filters);
    console.log('TransactionService: searchTerm in filters:', filters.searchTerm);
    console.log('TransactionService: search in filters:', filters.search);
    console.log('TransactionService: searchTerm type:', typeof filters.searchTerm);
    console.log('TransactionService: searchTerm length:', filters.searchTerm?.length);

    try {
      const {
        page = 1,
        limit = 100,
        category = '',
        searchTerm = '',
        search = '', // Add support for 'search' parameter as well
        dateRange = 'this-month',
        startDate = '',
        endDate = '',
        anomaliesOnly = false,
        policyStatus = '',
        sortBy = 'recent'
      } = filters;

      // Use either searchTerm or search parameter
      const actualSearchTerm = searchTerm || search || '';

      console.log('TransactionService: Destructured searchTerm:', searchTerm);
      console.log('TransactionService: Destructured search:', search);
      console.log('TransactionService: actualSearchTerm:', actualSearchTerm);
      console.log('TransactionService: actualSearchTerm type:', typeof actualSearchTerm);
      console.log('TransactionService: actualSearchTerm length:', actualSearchTerm?.length);

      // Build query
      const query = {
        userId,
        isDeleted: false
      };

      // Category filter
      if (category && category !== 'all') {
        query.category = category;
        console.log('TransactionService: Added category filter:', category);
      }

      // Search term filter - FIXED: Check for truthy actualSearchTerm and trim it
      const trimmedSearchTerm = actualSearchTerm ? actualSearchTerm.toString().trim() : '';
      if (trimmedSearchTerm && trimmedSearchTerm.length > 0) {
        console.log('TransactionService: Applying search term filter:', trimmedSearchTerm);
        query.$or = [
          { merchant: { $regex: trimmedSearchTerm, $options: 'i' } },
          { description: { $regex: trimmedSearchTerm, $options: 'i' } },
          { category: { $regex: trimmedSearchTerm, $options: 'i' } }
        ];
        console.log('TransactionService: Search query added:', JSON.stringify(query.$or));
      } else {
        console.log('TransactionService: No valid search term provided, skipping search filter');
      }

      // Date range filter - prioritize custom date range over predefined ranges
      if (startDate || endDate) {
        console.log('=== BACKEND DATE RANGE DEBUG ===');
        console.log('TransactionService: Using custom date range - startDate:', startDate, 'endDate:', endDate);

        query.date = {};

        if (startDate) {
          const startDateTime = new Date(startDate);
          console.log('TransactionService: Parsed startDate:', startDateTime);
          startDateTime.setHours(0, 0, 0, 0);
          query.date.$gte = startDateTime;
          console.log('TransactionService: Start date set to:', startDateTime);
        }

        if (endDate) {
          const endDateTime = new Date(endDate);
          console.log('TransactionService: Parsed endDate:', endDateTime);
          endDateTime.setHours(23, 59, 59, 999);
          query.date.$lte = endDateTime;
          console.log('TransactionService: End date set to:', endDateTime);
        }

        console.log('TransactionService: Final date query:', query.date);
        console.log('=== END BACKEND DATE RANGE DEBUG ===');
      } else {
        // Use predefined date ranges
        const now = new Date();
        let startDateRange, endDateRange;

        console.log('=== BACKEND PREDEFINED DATE RANGE DEBUG ===');
        console.log('TransactionService: Using predefined date range:', dateRange);

        switch (dateRange) {
          case 'this-week':
            startDateRange = new Date(now);
            startDateRange.setDate(now.getDate() - now.getDay());
            startDateRange.setHours(0, 0, 0, 0);
            break;
          case 'this-month':
            startDateRange = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'last-month':
            startDateRange = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDateRange = new Date(now.getFullYear(), now.getMonth(), 0);
            endDateRange.setHours(23, 59, 59, 999);
            break;
          case 'this-year':
            startDateRange = new Date(now.getFullYear(), 0, 1);
            break;
          case 'last-3-months':
            startDateRange = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            break;
          case 'last-6-months':
            startDateRange = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            break;
          case 'all-time':
            console.log('TransactionService: No date filter applied for all-time range');
            break;
        }

        if (startDateRange) {
          query.date = { $gte: startDateRange };
          if (endDateRange) {
            query.date.$lte = endDateRange;
          }
          console.log('TransactionService: Predefined date range applied:', {
            start: startDateRange,
            end: endDateRange
          });
        }
      }

      // Anomalies filter
      if (anomaliesOnly === true || anomaliesOnly === 'true') {
        query.hasAnomaly = true;
        console.log('TransactionService: Filtering for anomalies only');
      }

      // Policy status filter
      if (policyStatus) {
        query.policyStatus = policyStatus;
        console.log('TransactionService: Filtering by policy status:', policyStatus);
      }

      // Build sort
      let sort = {};
      switch (sortBy) {
        case 'amount-high':
          sort = { amount: -1 };
          break;
        case 'amount-low':
          sort = { amount: 1 };
          break;
        case 'merchant':
          sort = { merchant: 1 };
          break;
        case 'policy-status':
          sort = { policyStatus: 1, date: -1 };
          break;
        default:
          sort = { date: -1 };
      }

      // FIXED: Declare skip variable before using it in console.log
      const skip = (page - 1) * limit;

      console.log('TransactionService: Final query before execution:', JSON.stringify(query, null, 2));
      console.log('TransactionService: Query contains $or (search)?', !!query.$or);
      console.log('TransactionService: Sort order:', sort);
      console.log('TransactionService: Pagination - page:', page, 'limit:', limit, 'skip:', skip);

      console.log('=== EXECUTING MONGODB QUERY ===');
      console.log('TransactionService: About to execute MongoDB find with query:', JSON.stringify(query));
      console.log('TransactionService: MongoDB query stringified:', JSON.stringify(query, null, 2));

      // Execute query
      const [transactions, total] = await Promise.all([
        Transaction.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Transaction.countDocuments(query)
      ]);

      console.log('=== MONGODB QUERY RESULTS ===');
      console.log('TransactionService: MongoDB query executed');
      console.log('TransactionService: Total documents matching query:', total);
      console.log('TransactionService: Documents returned in this page:', transactions.length);
      console.log('TransactionService: First 3 transactions from DB:', transactions.slice(0, 3).map(t => ({
        merchant: t.merchant,
        category: t.category,
        description: t.description,
        amount: t.amount
      })));

      // Add this to check if any transactions have "wage" in them at all
      const allUserTransactions = await Transaction.find({ userId, isDeleted: false }).lean();
      console.log('=== CHECKING ALL USER TRANSACTIONS FOR WAGE ===');
      console.log('TransactionService: Total user transactions:', allUserTransactions.length);
      const wageTransactions = allUserTransactions.filter(t =>
        t.merchant.toLowerCase().includes('wage') ||
        t.category.toLowerCase().includes('wage') ||
        t.description.toLowerCase().includes('wage')
      );
      console.log('TransactionService: Transactions containing "wage":', wageTransactions.length);
      console.log('TransactionService: Wage transactions details:', wageTransactions.map(t => ({
        merchant: t.merchant,
        category: t.category,
        description: t.description
      })));
      console.log('=== END WAGE CHECK ===');

      console.log('TransactionService: Query executed successfully');
      console.log('TransactionService: Found', transactions.length, 'transactions out of', total, 'total');
      console.log('TransactionService: First transaction merchant:', transactions[0]?.merchant);
      console.log('TransactionService: Sample merchants from results:', transactions.slice(0, 5).map(t => t.merchant));
      console.log('=== TRANSACTION SERVICE DEBUG ENHANCED END ===');

      return {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
          hasMore: skip + transactions.length < total
        }
      };
    } catch (error) {
      console.error('=== TRANSACTION SERVICE ERROR ===');
      console.error('TransactionService: Error fetching transactions:', error.message);
      console.error('TransactionService: Error stack:', error.stack);
      console.error('=== END TRANSACTION SERVICE ERROR ===');
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }

  static async getById(transactionId, userId) {
    console.log('TransactionService: Fetching transaction:', transactionId);

    try {
      const transaction = await Transaction.findOne({
        _id: transactionId,
        userId,
        isDeleted: false
      }).lean();

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return transaction;
    } catch (error) {
      console.error('TransactionService: Error fetching transaction:', error.message);
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
  }

  static async create(userId, transactionData, userAccountType) {
    console.log('TransactionService: Creating transaction for user:', userId);
    console.log('TransactionService: User account type:', userAccountType);

    try {
      // Remove transactionType from the data as it's not in the schema
      const { transactionType, ...cleanTransactionData } = transactionData;

      const transaction = new Transaction({
        userId,
        ...cleanTransactionData
      });

      // Check for anomalies
      const anomalyResult = await this.detectAnomaly(userId, cleanTransactionData);
      console.log('TransactionService: Anomaly detection result:', anomalyResult);

      if (anomalyResult.hasAnomaly) {
        transaction.hasAnomaly = true;
        transaction.anomalyReason = anomalyResult.reason;
        transaction.anomalyComparison = anomalyResult.comparison;
        console.log('TransactionService: Transaction marked as anomaly');
      }

      // Save first to get ID for policy check
      const savedTransaction = await transaction.save();
      console.log('TransactionService: Transaction saved with ID:', savedTransaction._id);

      // Check policy compliance
      const userTransactions = await this.getTransactions(userId, {});
      const complianceResult = await PolicyService.checkCompliance(
        savedTransaction,
        userAccountType,
        userTransactions.transactions,
        userId
      );

      console.log('TransactionService: Policy compliance check completed:', complianceResult);

      // Update with compliance result
      savedTransaction.policyStatus = complianceResult.status;
      savedTransaction.policyRule = complianceResult.rule;
      await savedTransaction.save();

      console.log('TransactionService: Transaction created successfully');
      return savedTransaction;
    } catch (error) {
      console.error('TransactionService: Error creating transaction:', error.message);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }

  static async update(transactionId, userId, updateData, userAccountType) {
    console.log('TransactionService: Updating transaction:', transactionId);

    try {
      const transaction = await Transaction.findOne({
        _id: transactionId,
        userId,
        isDeleted: false
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Update fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          transaction[key] = updateData[key];
        }
      });

      // Re-check policy compliance if relevant fields changed
      if (updateData.amount || updateData.category || updateData.date) {
        const userTransactions = await this.getTransactions(userId, {});
        const complianceResult = await PolicyService.checkCompliance(
          transaction,
          userAccountType,
          userTransactions.transactions,
          userId
        );

        transaction.policyStatus = complianceResult.status;
        transaction.policyRule = complianceResult.rule;
      }

      const updatedTransaction = await transaction.save();
      console.log('TransactionService: Transaction updated successfully');

      return updatedTransaction;
    } catch (error) {
      console.error('TransactionService: Error updating transaction:', error.message);
      throw new Error(`Failed to update transaction: ${error.message}`);
    }
  }

  static async delete(transactionId, userId) {
    console.log('TransactionService: Deleting transaction:', transactionId);

    try {
      const transaction = await Transaction.findOneAndUpdate(
        { _id: transactionId, userId, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
      );

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      console.log('TransactionService: Transaction deleted successfully');
      return transaction;
    } catch (error) {
      console.error('TransactionService: Error deleting transaction:', error.message);
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }
  }

  static async addVoiceNote(transactionId, userId, voiceNoteData) {
    console.log('TransactionService: Adding voice note to transaction:', transactionId);

    try {
      const transaction = await Transaction.findOneAndUpdate(
        { _id: transactionId, userId, isDeleted: false },
        {
          $set: {
            hasNote: true,
            voiceNote: {
              audioData: voiceNoteData.audioData,
              transcript: voiceNoteData.transcript || '',
              recordedAt: new Date()
            }
          }
        },
        { new: true }
      );

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      console.log('TransactionService: Voice note added successfully');
      return transaction;
    } catch (error) {
      console.error('TransactionService: Error adding voice note:', error.message);
      throw new Error(`Failed to add voice note: ${error.message}`);
    }
  }

  static async updateCategory(transactionId, userId, category, userAccountType) {
    console.log('TransactionService: Updating category for transaction:', transactionId);

    try {
      const transaction = await Transaction.findOne({
        _id: transactionId,
        userId,
        isDeleted: false
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      transaction.category = category;

      // Re-check policy compliance with new category
      const userTransactions = await this.getTransactions(userId, {});
      const complianceResult = await PolicyService.checkCompliance(
        transaction,
        userAccountType,
        userTransactions.transactions,
        userId
      );

      transaction.policyStatus = complianceResult.status;
      transaction.policyRule = complianceResult.rule;

      const updatedTransaction = await transaction.save();
      console.log('TransactionService: Category updated successfully');

      return updatedTransaction;
    } catch (error) {
      console.error('TransactionService: Error updating category:', error.message);
      throw new Error(`Failed to update category: ${error.message}`);
    }
  }

  static async markAnomalyAsNormal(transactionId, userId) {
    console.log('TransactionService: Marking anomaly as normal for transaction:', transactionId);

    try {
      const transaction = await Transaction.findOneAndUpdate(
        { _id: transactionId, userId, isDeleted: false },
        {
          $set: {
            hasAnomaly: false,
            anomalyReason: null,
            anomalyComparison: null
          }
        },
        { new: true }
      );

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      console.log('TransactionService: Anomaly marked as normal successfully');
      return transaction;
    } catch (error) {
      console.error('TransactionService: Error marking anomaly as normal:', error.message);
      throw new Error(`Failed to mark anomaly as normal: ${error.message}`);
    }
  }

  static async detectAnomaly(userId, transactionData) {
    console.log('TransactionService: Detecting anomalies for transaction');

    try {
      // Skip income transactions (positive amounts) - these should not be flagged as anomalies
      if (transactionData.amount > 0) {
        console.log('TransactionService: Skipping positive amount (income) transaction');
        return { hasAnomaly: false };
      }

      // Skip certain categories that are typically regular income
      const incomeCategories = ['salary', 'wage', 'income', 'refund', 'deposit', 'transfer-in'];
      if (incomeCategories.includes(transactionData.category.toLowerCase())) {
        console.log('TransactionService: Skipping income category:', transactionData.category);
        return { hasAnomaly: false };
      }

      // Get user's transaction history for the same category (expenses only)
      const historicalTransactions = await Transaction.find({
        userId,
        category: transactionData.category,
        amount: { $lt: 0 }, // Only negative amounts (expenses)
        isDeleted: false
      }).limit(50).lean();

      console.log('TransactionService: Found', historicalTransactions.length, 'historical expense transactions');

      if (historicalTransactions.length < 3) {
        console.log('TransactionService: Not enough historical data for anomaly detection');
        return { hasAnomaly: false };
      }

      const amounts = historicalTransactions.map(t => Math.abs(t.amount));
      const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const currentAmount = Math.abs(transactionData.amount);

      // Calculate standard deviation for more accurate anomaly detection
      const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - avgAmount, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      // More conservative thresholds to reduce false positives
      const moderateThreshold = avgAmount + (2.5 * stdDev); // 2.5 standard deviations
      const majorThreshold = avgAmount + (3.5 * stdDev); // 3.5 standard deviations

      // Additional check for very small amounts - don't flag small differences as anomalies
      if (currentAmount < 20 && Math.abs(currentAmount - avgAmount) < 10) {
        console.log('TransactionService: Skipping small amount anomaly detection');
        return { hasAnomaly: false };
      }

      let hasAnomaly = false;
      let severity = 'minor';
      let reason = '';

      if (currentAmount > majorThreshold && currentAmount > avgAmount * 3.5) {
        hasAnomaly = true;
        severity = 'major';
        reason = `This ${transactionData.category} expense is highly unusual - ${Math.round(currentAmount / avgAmount)}x your typical spending`;
      } else if (currentAmount > moderateThreshold && currentAmount > avgAmount * 2.5) {
        hasAnomaly = true;
        severity = 'moderate';
        reason = `This ${transactionData.category} expense is significantly higher than usual`;
      } else if (currentAmount > avgAmount * 2 && currentAmount > avgAmount + (2 * stdDev)) {
        hasAnomaly = true;
        severity = 'minor';
        reason = `This ${transactionData.category} expense is above your normal range`;
      }

      const result = {
        hasAnomaly,
        severity,
        reason,
        comparison: `You usually spend $${avgAmount.toFixed(2)} on ${transactionData.category}, this was $${currentAmount.toFixed(2)}`
      };

      console.log('TransactionService: Anomaly detection result:', result);
      return result;
    } catch (error) {
      console.error('TransactionService: Error detecting anomaly:', error.message);
      return { hasAnomaly: false };
    }
  }
}

module.exports = TransactionService;