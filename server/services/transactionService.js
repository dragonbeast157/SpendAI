const Transaction = require('../models/Transaction');
const PolicyService = require('./policyService');

class TransactionService {

  static async getTransactions(userId, filters = {}) {
    console.log('TransactionService: Fetching transactions for user:', userId);
    console.log('TransactionService: Filters:', filters);

    try {
      const {
        page = 1,
        limit = 20,
        category = '',
        searchTerm = '',
        dateRange = 'this-month',
        anomaliesOnly = false,
        policyStatus = '',
        sortBy = 'recent'
      } = filters;

      // Build query
      const query = {
        userId,
        isDeleted: false
      };

      // Category filter
      if (category) {
        query.category = category;
      }

      // Search term filter
      if (searchTerm) {
        query.$or = [
          { merchant: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ];
      }

      // Date range filter
      const now = new Date();
      let startDate, endDate;

      switch (dateRange) {
        case 'this-week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'this-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last-month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'this-year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      if (startDate) {
        query.date = { $gte: startDate };
        if (endDate) {
          query.date.$lte = endDate;
        }
      }

      // Anomalies filter
      if (anomaliesOnly) {
        query.hasAnomaly = true;
      }

      // Policy status filter
      if (policyStatus) {
        query.policyStatus = policyStatus;
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

      // Execute query
      const skip = (page - 1) * limit;
      const [transactions, total] = await Promise.all([
        Transaction.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Transaction.countDocuments(query)
      ]);

      console.log('TransactionService: Found', transactions.length, 'transactions');

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('TransactionService: Error fetching transactions:', error.message);
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
    console.log('=== TRANSACTION SERVICE CREATE START ===');
    console.log('TransactionService: Creating transaction for user:', userId);
    console.log('TransactionService: User account type:', userAccountType);
    console.log('TransactionService: Transaction data:', transactionData);

    try {
      const transaction = new Transaction({
        userId,
        ...transactionData
      });

      // Check for anomalies (improved implementation)
      const anomalyResult = await this.detectAnomaly(userId, transactionData);
      console.log('TransactionService: Anomaly detection result for new transaction:', anomalyResult);

      if (anomalyResult.hasAnomaly) {
        transaction.hasAnomaly = true;
        transaction.anomalyReason = anomalyResult.reason;
        transaction.anomalyComparison = anomalyResult.comparison;
        console.log('TransactionService: Transaction marked as anomaly:', {
          hasAnomaly: transaction.hasAnomaly,
          reason: transaction.anomalyReason,
          comparison: transaction.anomalyComparison
        });
      }

      // Save first to get ID for policy check
      const savedTransaction = await transaction.save();
      console.log('TransactionService: Transaction saved with ID:', savedTransaction._id);

      // Check policy compliance
      console.log('TransactionService: Starting policy compliance check...');
      const userTransactions = await this.getTransactions(userId, {});
      console.log('TransactionService: Retrieved', userTransactions.transactions.length, 'user transactions for compliance check');

      const complianceResult = await PolicyService.checkCompliance(
        savedTransaction,
        userAccountType,
        userTransactions.transactions,
        userId
      );

      console.log('TransactionService: Policy compliance check completed');
      console.log('TransactionService: Compliance result:', complianceResult);

      // Update with compliance result
      savedTransaction.policyStatus = complianceResult.status;
      savedTransaction.policyRule = complianceResult.rule;
      await savedTransaction.save();

      console.log('TransactionService: Final transaction after policy check:', {
        id: savedTransaction._id,
        hasAnomaly: savedTransaction.hasAnomaly,
        anomalyReason: savedTransaction.anomalyReason,
        policyStatus: savedTransaction.policyStatus,
        policyRule: savedTransaction.policyRule
      });

      console.log('=== TRANSACTION SERVICE CREATE END ===');
      return savedTransaction;
    } catch (error) {
      console.error('=== TRANSACTION SERVICE CREATE ERROR ===');
      console.error('TransactionService: Error creating transaction:', error.message);
      console.error('TransactionService: Error stack:', error.stack);
      console.error('=== END TRANSACTION SERVICE CREATE ERROR ===');
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
    console.log('=== TRANSACTION SERVICE ADD VOICE NOTE START ===');
    console.log('TransactionService: Adding voice note to transaction:', transactionId);
    console.log('TransactionService: User ID:', userId);
    console.log('TransactionService: Voice note data:', { hasAudioData: !!voiceNoteData.audioData, transcript: voiceNoteData.transcript });

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
        console.error('TransactionService: Transaction not found for voice note addition');
        throw new Error('Transaction not found');
      }

      console.log('TransactionService: Voice note added successfully');
      console.log('TransactionService: Updated transaction hasNote:', transaction.hasNote);
      console.log('=== TRANSACTION SERVICE ADD VOICE NOTE END ===');
      return transaction;
    } catch (error) {
      console.error('=== TRANSACTION SERVICE ADD VOICE NOTE ERROR ===');
      console.error('TransactionService: Error adding voice note:', error.message);
      console.error('TransactionService: Error stack:', error.stack);
      console.error('=== END TRANSACTION SERVICE ADD VOICE NOTE ERROR ===');
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
    console.log('=== MARK ANOMALY AS NORMAL START ===');
    console.log('TransactionService: Marking anomaly as normal for transaction:', transactionId);
    console.log('TransactionService: User ID:', userId);

    try {
      // First, let's see the current state of the transaction
      const currentTransaction = await Transaction.findOne({
        _id: transactionId,
        userId,
        isDeleted: false
      });

      if (!currentTransaction) {
        console.error('TransactionService: Transaction not found for anomaly marking');
        throw new Error('Transaction not found');
      }

      console.log('TransactionService: BEFORE update - transaction state:', {
        id: currentTransaction._id,
        hasAnomaly: currentTransaction.hasAnomaly,
        hasAnomalyType: typeof currentTransaction.hasAnomaly,
        anomalyReason: currentTransaction.anomalyReason,
        anomalyComparison: currentTransaction.anomalyComparison
      });

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
        console.error('TransactionService: Transaction not found after update');
        throw new Error('Transaction not found');
      }

      console.log('TransactionService: AFTER update - transaction state:', {
        id: transaction._id,
        hasAnomaly: transaction.hasAnomaly,
        hasAnomalyType: typeof transaction.hasAnomaly,
        anomalyReason: transaction.anomalyReason,
        anomalyComparison: transaction.anomalyComparison
      });

      // Verify the update was successful by fetching the transaction again
      const verifyTransaction = await Transaction.findOne({
        _id: transactionId,
        userId,
        isDeleted: false
      });

      console.log('TransactionService: VERIFICATION - transaction state after save:', {
        id: verifyTransaction._id,
        hasAnomaly: verifyTransaction.hasAnomaly,
        hasAnomalyType: typeof verifyTransaction.hasAnomaly,
        anomalyReason: verifyTransaction.anomalyReason,
        anomalyComparison: verifyTransaction.anomalyComparison
      });

      console.log('TransactionService: Anomaly marked as normal successfully');
      console.log('=== MARK ANOMALY AS NORMAL END ===');
      return transaction;
    } catch (error) {
      console.error('=== MARK ANOMALY AS NORMAL ERROR ===');
      console.error('TransactionService: Error marking anomaly as normal:', error.message);
      console.error('TransactionService: Error stack:', error.stack);
      console.error('=== END MARK ANOMALY AS NORMAL ERROR ===');
      throw new Error(`Failed to mark anomaly as normal: ${error.message}`);
    }
  }

  static async detectAnomaly(userId, transactionData) {
    console.log('TransactionService: Detecting anomalies for transaction');
    console.log('TransactionService: Transaction data for anomaly check:', {
      amount: transactionData.amount,
      category: transactionData.category,
      merchant: transactionData.merchant
    });

    try {
      // Skip income transactions (positive amounts) - these should not be flagged as anomalies
      if (transactionData.amount > 0) {
        console.log('TransactionService: Skipping positive amount (income) transaction:', transactionData.amount);
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

      console.log('TransactionService: Found', historicalTransactions.length, 'historical expense transactions for category:', transactionData.category);

      if (historicalTransactions.length > 0) {
        const historicalAmounts = historicalTransactions.map(t => Math.abs(t.amount));
        console.log('TransactionService: Historical amounts for category:', historicalAmounts);
      }

      if (historicalTransactions.length < 3) {
        console.log('TransactionService: Not enough historical data for anomaly detection - need at least 3, have', historicalTransactions.length);
        return { hasAnomaly: false };
      }

      const amounts = historicalTransactions.map(t => Math.abs(t.amount));
      const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const currentAmount = Math.abs(transactionData.amount);

      console.log('TransactionService: Anomaly calculation details:', {
        currentAmount,
        avgAmount,
        historicalCount: amounts.length,
        minHistorical: Math.min(...amounts),
        maxHistorical: Math.max(...amounts)
      });

      // Calculate standard deviation for more accurate anomaly detection
      const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - avgAmount, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      console.log('TransactionService: Statistical analysis:', {
        variance,
        stdDev,
        currentVsAvg: currentAmount / avgAmount
      });

      // More conservative thresholds to reduce false positives
      const moderateThreshold = avgAmount + (2.5 * stdDev); // 2.5 standard deviations
      const majorThreshold = avgAmount + (3.5 * stdDev); // 3.5 standard deviations

      console.log('TransactionService: Anomaly thresholds:', {
        moderateThreshold,
        majorThreshold,
        currentAmount
      });

      let hasAnomaly = false;
      let severity = 'minor';
      let reason = '';

      // Additional check for very small amounts - don't flag small differences as anomalies
      if (currentAmount < 20 && Math.abs(currentAmount - avgAmount) < 10) {
        console.log('TransactionService: Skipping small amount anomaly detection');
        return { hasAnomaly: false };
      }

      if (currentAmount > majorThreshold && currentAmount > avgAmount * 3.5) {
        hasAnomaly = true;
        severity = 'major';
        reason = `This ${transactionData.category} expense is highly unusual - ${Math.round(currentAmount / avgAmount)}x your typical spending`;
        console.log('TransactionService: MAJOR anomaly detected - currentAmount:', currentAmount, 'majorThreshold:', majorThreshold, 'avgAmount*3.5:', avgAmount * 3.5);
      } else if (currentAmount > moderateThreshold && currentAmount > avgAmount * 2.5) {
        hasAnomaly = true;
        severity = 'moderate';
        reason = `This ${transactionData.category} expense is significantly higher than usual`;
        console.log('TransactionService: MODERATE anomaly detected - currentAmount:', currentAmount, 'moderateThreshold:', moderateThreshold, 'avgAmount*2.5:', avgAmount * 2.5);
      } else if (currentAmount > avgAmount * 2 && currentAmount > avgAmount + (2 * stdDev)) {
        hasAnomaly = true;
        severity = 'minor';
        reason = `This ${transactionData.category} expense is above your normal range`;
        console.log('TransactionService: MINOR anomaly detected - currentAmount:', currentAmount, 'avgAmount*2:', avgAmount * 2);
      } else {
        console.log('TransactionService: NO anomaly detected - currentAmount:', currentAmount, 'is within normal ranges');
      }

      const result = {
        hasAnomaly,
        severity,
        reason,
        comparison: `You usually spend $${avgAmount.toFixed(2)} on ${transactionData.category}, this was $${currentAmount.toFixed(2)}`
      };

      console.log('TransactionService: Final anomaly detection result:', result);
      return result;
    } catch (error) {
      console.error('TransactionService: Error detecting anomaly:', error.message);
      return { hasAnomaly: false };
    }
  }
}

module.exports = TransactionService;