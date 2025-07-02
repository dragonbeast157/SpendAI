const Transaction = require('../models/Transaction');

class AnalysisService {

  static async getCategoryAnalysis(userId, filters = {}) {
    console.log('AnalysisService: Getting category analysis for user:', userId);
    console.log('AnalysisService: Filters:', filters);

    try {
      const { dateRange = 'this-month', startDate, endDate } = filters;

      // Build date filter
      const query = {
        userId,
        isDeleted: false
      };

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      } else {
        // Default date range logic
        const now = new Date();
        let rangeStartDate;

        switch (dateRange) {
          case 'this-week':
            rangeStartDate = new Date(now);
            rangeStartDate.setDate(now.getDate() - now.getDay());
            rangeStartDate.setHours(0, 0, 0, 0);
            break;
          case 'this-month':
            rangeStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'last-month':
            rangeStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            query.date = { $gte: rangeStartDate, $lte: lastMonthEnd };
            break;
          case 'this-year':
            rangeStartDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            rangeStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        if (!query.date) {
          query.date = { $gte: rangeStartDate };
        }
      }

      // Aggregate spending by category
      const categoryData = await Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: { $abs: '$amount' } },
            transactionCount: { $sum: 1 },
            avgAmount: { $avg: { $abs: '$amount' } }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]);

      // Calculate total spending
      const totalSpending = categoryData.reduce((sum, cat) => sum + cat.totalAmount, 0);

      // Format response with percentages
      const categoriesWithPercentages = categoryData.map(cat => ({
        category: this.formatCategoryName(cat._id),
        amount: parseFloat(cat.totalAmount.toFixed(2)),
        percentage: parseFloat(((cat.totalAmount / totalSpending) * 100).toFixed(1)),
        transactionCount: cat.transactionCount,
        avgAmount: parseFloat(cat.avgAmount.toFixed(2))
      }));

      console.log('AnalysisService: Category analysis completed, found', categoryData.length, 'categories');

      return {
        categories: categoriesWithPercentages,
        totalSpending: parseFloat(totalSpending.toFixed(2)),
        period: dateRange,
        dateRange: query.date
      };
    } catch (error) {
      console.error('AnalysisService: Error getting category analysis:', error.message);
      throw new Error(`Failed to analyze spending categories: ${error.message}`);
    }
  }

  static async detectAnomalies(userId, filters = {}) {
    console.log('=== DETECT ANOMALIES START ===');
    console.log('AnalysisService: Detecting anomalies for user:', userId);
    console.log('AnalysisService: User ID type:', typeof userId);
    console.log('AnalysisService: Filters:', filters);

    try {
      const { dateRange = 'this-month', severityLevel = 'all' } = filters;

      // Get recent transactions
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case 'this-week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'this-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last-30-days':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      console.log('AnalysisService: Date range filter - startDate:', startDate);
      console.log('AnalysisService: Current date:', now);

      // First, let's check if there are ANY transactions for this user at all
      const allUserTransactions = await Transaction.find({
        userId,
        isDeleted: false
      }).lean();

      console.log('AnalysisService: TOTAL transactions for user (all time):', allUserTransactions.length);

      if (allUserTransactions.length > 0) {
        console.log('AnalysisService: Sample of all user transactions:');
        allUserTransactions.slice(0, 5).forEach((t, index) => {
          console.log(`  Transaction ${index + 1}:`, {
            id: t._id,
            amount: t.amount,
            date: t.date,
            merchant: t.merchant,
            category: t.category,
            hasAnomaly: t.hasAnomaly
          });
        });

        // Check date ranges
        const dates = allUserTransactions.map(t => t.date);
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        console.log('AnalysisService: Transaction date range:', {
          earliest: minDate,
          latest: maxDate,
          filterStartDate: startDate
        });
      } else {
        console.log('AnalysisService: NO TRANSACTIONS FOUND for user:', userId);
        return {
          anomalies: [],
          summary: { total: 0, major: 0, moderate: 0, minor: 0 },
          period: dateRange
        };
      }

      // Now check transactions in the date range
      const transactionsInRange = await Transaction.find({
        userId,
        isDeleted: false,
        date: { $gte: startDate }
      }).lean();

      console.log('AnalysisService: Transactions in date range:', transactionsInRange.length);

      if (transactionsInRange.length > 0) {
        console.log('AnalysisService: Sample transactions in date range:');
        transactionsInRange.slice(0, 5).forEach((t, index) => {
          console.log(`  Transaction ${index + 1}:`, {
            id: t._id,
            amount: t.amount,
            date: t.date,
            merchant: t.merchant,
            category: t.category,
            hasAnomaly: t.hasAnomaly
          });
        });
      }

      // Get ALL recent transactions, but exclude those manually marked as normal
      const recentTransactions = await Transaction.find({
        userId,
        isDeleted: false,
        date: { $gte: startDate },
        $or: [
          { hasAnomaly: { $exists: false } },
          { hasAnomaly: true },
          { hasAnomaly: null },
          { hasAnomaly: { $ne: false } }
        ]
      }).sort({ date: -1 }).lean();

      console.log('AnalysisService: Recent transactions after filtering:', recentTransactions.length);

      // Log details about each transaction
      recentTransactions.forEach((transaction, index) => {
        console.log(`AnalysisService: Filtered transaction ${index + 1}:`, {
          id: transaction._id,
          merchant: transaction.merchant,
          amount: transaction.amount,
          hasAnomaly: transaction.hasAnomaly,
          hasAnomalyType: typeof transaction.hasAnomaly,
          category: transaction.category,
          date: transaction.date
        });
      });

      // Get historical data for comparison (last 6 months)
      const historicalStartDate = new Date(now);
      historicalStartDate.setMonth(now.getMonth() - 6);

      const historicalTransactions = await Transaction.find({
        userId,
        isDeleted: false,
        date: { $gte: historicalStartDate, $lt: startDate }
      }).lean();

      console.log('AnalysisService: Historical transactions found:', historicalTransactions.length);
      console.log('AnalysisService: Historical date range:', {
        from: historicalStartDate,
        to: startDate
      });

      const anomalies = [];

      // Analyze each recent transaction
      for (const transaction of recentTransactions) {
        console.log('AnalysisService: Analyzing transaction for anomaly:', {
          id: transaction._id,
          merchant: transaction.merchant,
          amount: transaction.amount,
          hasAnomaly: transaction.hasAnomaly
        });

        // Skip transactions that have already been manually marked as normal
        if (transaction.hasAnomaly === false) {
          console.log('AnalysisService: SKIPPING transaction manually marked as normal:', transaction._id);
          continue;
        }

        const anomaly = await this.analyzeTransactionAnomaly(transaction, historicalTransactions);
        console.log('AnalysisService: Anomaly analysis result for transaction', transaction._id, ':', anomaly);

        if (anomaly.isAnomaly) {
          console.log('AnalysisService: ANOMALY DETECTED for transaction:', {
            id: transaction._id,
            merchant: transaction.merchant,
            amount: transaction.amount,
            category: transaction.category,
            severity: anomaly.severity,
            reason: anomaly.reason
          });

          // Update the transaction in the database to mark it as an anomaly
          await Transaction.findByIdAndUpdate(transaction._id, {
            hasAnomaly: true,
            anomalyReason: anomaly.reason,
            anomalyComparison: anomaly.comparison
          });

          anomalies.push({
            ...transaction,
            hasAnomaly: true,
            anomalyReason: anomaly.reason,
            anomalyComparison: anomaly.comparison,
            anomalyDetails: anomaly
          });
        } else {
          console.log('AnalysisService: NO ANOMALY for transaction:', transaction._id);

          // Update the transaction to mark it as analyzed (but not an anomaly)
          await Transaction.findByIdAndUpdate(transaction._id, {
            hasAnomaly: null
          });
        }
      }

      console.log('AnalysisService: TOTAL anomalies found before filtering:', anomalies.length);

      // Filter by severity if specified
      let filteredAnomalies = anomalies;
      if (severityLevel !== 'all') {
        filteredAnomalies = anomalies.filter(a => a.anomalyDetails.severity === severityLevel);
        console.log('AnalysisService: Filtered anomalies by severity', severityLevel, ':', filteredAnomalies.length);
      }

      // Sort by severity and amount
      filteredAnomalies.sort((a, b) => {
        const severityOrder = { 'major': 3, 'moderate': 2, 'minor': 1 };
        const aSeverity = severityOrder[a.anomalyDetails.severity] || 0;
        const bSeverity = severityOrder[b.anomalyDetails.severity] || 0;

        if (aSeverity !== bSeverity) {
          return bSeverity - aSeverity;
        }
        return Math.abs(b.amount) - Math.abs(a.amount);
      });

      const summary = {
        total: anomalies.length,
        major: anomalies.filter(a => a.anomalyDetails.severity === 'major').length,
        moderate: anomalies.filter(a => a.anomalyDetails.severity === 'moderate').length,
        minor: anomalies.filter(a => a.anomalyDetails.severity === 'minor').length
      };

      console.log('AnalysisService: FINAL RESULT - anomalies:', filteredAnomalies.length);
      console.log('AnalysisService: FINAL SUMMARY:', summary);
      console.log('AnalysisService: FINAL ANOMALIES DATA:', filteredAnomalies);
      console.log('=== DETECT ANOMALIES END ===');

      return {
        anomalies: filteredAnomalies,
        summary,
        period: dateRange
      };
    } catch (error) {
      console.error('AnalysisService: Error detecting anomalies:', error.message);
      console.error('AnalysisService: Error stack:', error.stack);
      throw new Error(`Failed to detect anomalies: ${error.message}`);
    }
  }

  static async analyzeTransactionAnomaly(transaction, historicalTransactions) {
    try {
      console.log('=== ANALYZE TRANSACTION ANOMALY START ===');
      console.log('AnalysisService: Analyzing transaction for anomaly:', {
        id: transaction._id,
        amount: transaction.amount,
        category: transaction.category,
        merchant: transaction.merchant
      });

      // Skip income transactions (positive amounts) - these should not be flagged as anomalies
      if (transaction.amount > 0) {
        console.log('AnalysisService: SKIPPING positive amount (income) transaction:', transaction.amount);
        console.log('=== ANALYZE TRANSACTION ANOMALY END (INCOME) ===');
        return { isAnomaly: false };
      }

      // Skip certain categories that are typically regular income
      const incomeCategories = ['salary', 'wage', 'income', 'refund', 'deposit', 'transfer-in'];
      if (incomeCategories.includes(transaction.category.toLowerCase())) {
        console.log('AnalysisService: SKIPPING income category:', transaction.category);
        console.log('=== ANALYZE TRANSACTION ANOMALY END (INCOME CATEGORY) ===');
        return { isAnomaly: false };
      }

      // Get transactions from same category and same transaction type (expenses only)
      const categoryTransactions = historicalTransactions.filter(t =>
        t.category === transaction.category && t.amount < 0 // Only negative amounts (expenses)
      );

      console.log('AnalysisService: Historical transactions analysis:', {
        totalHistorical: historicalTransactions.length,
        categoryTransactions: categoryTransactions.length,
        category: transaction.category
      });

      // Log some sample historical transactions for this category
      if (categoryTransactions.length > 0) {
        console.log('AnalysisService: Sample historical transactions for category', transaction.category, ':');
        categoryTransactions.slice(0, 5).forEach((t, index) => {
          console.log(`  ${index + 1}. Amount: ${t.amount}, Date: ${t.date}, Merchant: ${t.merchant}`);
        });
      }

      if (categoryTransactions.length < 3) {
        console.log('AnalysisService: NOT ENOUGH historical data for anomaly detection - need at least 3, have', categoryTransactions.length);
        
        // Let's try a different approach - check if this transaction is significantly different from ANY historical transactions
        const allExpenseTransactions = historicalTransactions.filter(t => t.amount < 0);
        console.log('AnalysisService: Trying with ALL expense transactions:', allExpenseTransactions.length);
        
        if (allExpenseTransactions.length >= 3) {
          const amounts = allExpenseTransactions.map(t => Math.abs(t.amount));
          const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
          const currentAmount = Math.abs(transaction.amount);
          
          console.log('AnalysisService: General expense analysis:', {
            currentAmount,
            avgAmount,
            ratio: currentAmount / avgAmount,
            maxHistorical: Math.max(...amounts)
          });
          
          // If this transaction is significantly larger than average, flag it
          if (currentAmount > avgAmount * 3 && currentAmount > 100) {
            console.log('AnalysisService: ANOMALY DETECTED based on general spending pattern');
            console.log('=== ANALYZE TRANSACTION ANOMALY END (GENERAL ANOMALY) ===');
            return {
              isAnomaly: true,
              severity: 'moderate',
              reason: `This expense is unusually high compared to your typical spending patterns`,
              comparison: `This $${currentAmount.toFixed(2)} expense is much higher than your average expense of $${avgAmount.toFixed(2)}`
            };
          }
        }
        
        console.log('=== ANALYZE TRANSACTION ANOMALY END (INSUFFICIENT DATA) ===');
        return { isAnomaly: false };
      }

      const amounts = categoryTransactions.map(t => Math.abs(t.amount));
      const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const currentAmount = Math.abs(transaction.amount);

      console.log('AnalysisService: Anomaly calculation:', {
        currentAmount,
        avgAmount,
        ratio: currentAmount / avgAmount,
        historicalCount: amounts.length,
        minHistorical: Math.min(...amounts),
        maxHistorical: Math.max(...amounts)
      });

      // Calculate standard deviation
      const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - avgAmount, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      console.log('AnalysisService: Statistical analysis:', {
        variance: variance.toFixed(2),
        stdDev: stdDev.toFixed(2),
        currentVsAvg: (currentAmount / avgAmount).toFixed(2)
      });

      // Determine if it's an anomaly and its severity
      const zScore = (currentAmount - avgAmount) / (stdDev || 1);

      let isAnomaly = false;
      let severity = 'minor';
      let reason = '';

      console.log('AnalysisService: Anomaly thresholds check:', {
        zScore: zScore.toFixed(2),
        currentAmount,
        avgAmount,
        'avgAmount * 3': avgAmount * 3,
        'avgAmount * 2.5': avgAmount * 2.5,
        'avgAmount * 2': avgAmount * 2
      });

      // More conservative thresholds to reduce false positives
      if (Math.abs(zScore) > 3.5 && currentAmount > avgAmount * 3) {
        isAnomaly = true;
        severity = 'major';
        reason = `This ${transaction.category} expense is highly unusual - ${Math.round(currentAmount / avgAmount)}x your typical spending`;
        console.log('AnalysisService: MAJOR anomaly detected');
      } else if (Math.abs(zScore) > 2.5 && currentAmount > avgAmount * 2.5) {
        isAnomaly = true;
        severity = 'moderate';
        reason = `This ${transaction.category} expense is significantly higher than usual`;
        console.log('AnalysisService: MODERATE anomaly detected');
      } else if (currentAmount > avgAmount * 2 && currentAmount > avgAmount + (2 * stdDev)) {
        isAnomaly = true;
        severity = 'minor';
        reason = `This ${transaction.category} expense is above your normal range`;
        console.log('AnalysisService: MINOR anomaly detected');
      } else {
        console.log('AnalysisService: NO anomaly detected - within normal thresholds');
      }

      // Additional check for very small amounts - don't flag small differences as anomalies
      if (currentAmount < 20 && Math.abs(currentAmount - avgAmount) < 10) {
        console.log('AnalysisService: OVERRIDING anomaly detection for small amount');
        isAnomaly = false;
      }

      const result = {
        isAnomaly,
        severity,
        reason,
        comparison: `You usually spend $${avgAmount.toFixed(2)} on ${transaction.category}, this was $${currentAmount.toFixed(2)}`,
        zScore: parseFloat(zScore.toFixed(2)),
        expectedRange: {
          min: parseFloat((avgAmount - stdDev).toFixed(2)),
          max: parseFloat((avgAmount + stdDev).toFixed(2)),
          average: parseFloat(avgAmount.toFixed(2))
        }
      };

      console.log('AnalysisService: FINAL anomaly analysis result:', result);
      console.log('=== ANALYZE TRANSACTION ANOMALY END ===');
      return result;
    } catch (error) {
      console.error('AnalysisService: Error analyzing transaction anomaly:', error.message);
      console.log('=== ANALYZE TRANSACTION ANOMALY END (ERROR) ===');
      return { isAnomaly: false };
    }
  }

  static formatCategoryName(category) {
    if (!category) return 'Other';
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
}

module.exports = AnalysisService;