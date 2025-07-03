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
    console.log('=== ANALYSIS SERVICE DETECT ANOMALIES START ===');
    console.log('AnalysisService: detectAnomalies called');
    console.log('AnalysisService: userId:', userId);
    console.log('AnalysisService: userId type:', typeof userId);
    console.log('AnalysisService: filters:', filters);

    try {
      const { dateRange = 'this-month', severityLevel = 'all' } = filters;

      console.log('AnalysisService: Extracted filters:', { dateRange, severityLevel });

      // Get ALL transactions for this user to analyze for anomalies
      console.log('AnalysisService: About to query Transaction.find...');
      console.log('AnalysisService: Query will be:', { userId, isDeleted: false });

      const allUserTransactions = await Transaction.find({
        userId,
        isDeleted: false
      }).sort({ date: -1 }).lean();

      console.log('AnalysisService: Transaction.find completed');
      console.log('AnalysisService: TOTAL transactions found for user:', allUserTransactions.length);
      console.log('AnalysisService: Transactions type:', typeof allUserTransactions);
      console.log('AnalysisService: Transactions is array:', Array.isArray(allUserTransactions));

      if (allUserTransactions.length === 0) {
        console.log('AnalysisService: NO TRANSACTIONS FOUND for user:', userId);
        const emptyResult = {
          anomalies: [],
          summary: { total: 0, major: 0, moderate: 0, minor: 0 },
          period: dateRange
        };
        console.log('AnalysisService: Returning empty result:', emptyResult);
        return emptyResult;
      }

      // Log sample of all transactions
      console.log('AnalysisService: Sample of ALL user transactions:');
      allUserTransactions.slice(0, 10).forEach((t, index) => {
        console.log(`  Transaction ${index + 1}:`, {
          id: t._id,
          amount: t.amount,
          date: t.date,
          merchant: t.merchant,
          category: t.category,
          hasAnomaly: t.hasAnomaly,
          hasAnomalyType: typeof t.hasAnomaly
        });
      });

      // Look for obvious anomalies
      const largeTransactions = allUserTransactions.filter(t => Math.abs(t.amount) > 500);
      console.log('AnalysisService: Large transactions found:', largeTransactions.length);
      largeTransactions.forEach((t, i) => {
        console.log(`  Large transaction ${i + 1}:`, {
          id: t._id,
          amount: t.amount,
          merchant: t.merchant,
          category: t.category,
          hasAnomaly: t.hasAnomaly
        });
      });

      // Get transactions that haven't been manually marked as normal
      const candidateTransactions = allUserTransactions.filter(t =>
        t.hasAnomaly !== false // Include null, undefined, and true, but exclude false
      );

      console.log('AnalysisService: Candidate transactions for anomaly analysis:', candidateTransactions.length);
      console.log('AnalysisService: Filtering logic - transactions with hasAnomaly !== false');

      // Log details about candidate transactions
      candidateTransactions.slice(0, 10).forEach((transaction, index) => {
        console.log(`AnalysisService: Candidate transaction ${index + 1}:`, {
          id: transaction._id,
          merchant: transaction.merchant,
          amount: transaction.amount,
          hasAnomaly: transaction.hasAnomaly,
          hasAnomalyType: typeof transaction.hasAnomaly,
          category: transaction.category,
          date: transaction.date
        });
      });

      // Use all transactions as historical data for now
      const historicalTransactions = allUserTransactions;
      console.log('AnalysisService: Using all transactions as historical data:', historicalTransactions.length);

      const anomalies = [];
      console.log('AnalysisService: Starting to analyze each candidate transaction...');

      // Analyze each candidate transaction
      for (let i = 0; i < candidateTransactions.length; i++) {
        const transaction = candidateTransactions[i];
        console.log(`AnalysisService: Analyzing transaction ${i + 1}/${candidateTransactions.length}:`, {
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

        console.log('AnalysisService: About to call analyzeTransactionAnomaly...');
        const anomaly = await this.analyzeTransactionAnomaly(transaction, historicalTransactions);
        console.log('AnalysisService: analyzeTransactionAnomaly completed for transaction', transaction._id);
        console.log('AnalysisService: Anomaly analysis result:', anomaly);

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
          console.log('AnalysisService: Updating transaction in database...');
          await Transaction.findByIdAndUpdate(transaction._id, {
            hasAnomaly: true,
            anomalyReason: anomaly.reason,
            anomalyComparison: anomaly.comparison
          });
          console.log('AnalysisService: Transaction updated in database');

          anomalies.push({
            ...transaction,
            hasAnomaly: true,
            anomalyReason: anomaly.reason,
            anomalyComparison: anomaly.comparison,
            anomalyDetails: anomaly
          });
        } else {
          console.log('AnalysisService: NO ANOMALY for transaction:', transaction._id);
        }
      }

      console.log('AnalysisService: Finished analyzing all transactions');
      console.log('AnalysisService: TOTAL anomalies found:', anomalies.length);

      const summary = {
        total: anomalies.length,
        major: anomalies.filter(a => a.anomalyDetails.severity === 'major').length,
        moderate: anomalies.filter(a => a.anomalyDetails.severity === 'moderate').length,
        minor: anomalies.filter(a => a.anomalyDetails.severity === 'minor').length
      };

      const result = {
        anomalies: anomalies,
        summary,
        period: dateRange
      };

      console.log('AnalysisService: FINAL RESULT:', {
        anomaliesCount: result.anomalies.length,
        summary: result.summary,
        period: result.period
      });
      console.log('AnalysisService: FINAL ANOMALIES:', result.anomalies);
      console.log('=== ANALYSIS SERVICE DETECT ANOMALIES END ===');

      return result;
    } catch (error) {
      console.error('=== ANALYSIS SERVICE DETECT ANOMALIES ERROR ===');
      console.error('AnalysisService: Error detecting anomalies:', error);
      console.error('AnalysisService: Error name:', error.name);
      console.error('AnalysisService: Error message:', error.message);
      console.error('AnalysisService: Error stack:', error.stack);
      console.error('=== END ANALYSIS SERVICE DETECT ANOMALIES ERROR ===');
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

      const currentAmount = Math.abs(transaction.amount);
      const merchantLower = transaction.merchant.toLowerCase();
      const categoryLower = transaction.category.toLowerCase();

      console.log('AnalysisService: Transaction details for analysis:', {
        currentAmount,
        merchantLower,
        categoryLower
      });

      // RULE 1: Very large transactions (over $500) are always anomalies
      if (currentAmount > 500) {
        console.log('AnalysisService: LARGE TRANSACTION ANOMALY - amount over $500:', currentAmount);
        return {
          isAnomaly: true,
          severity: currentAmount > 1000 ? 'major' : 'moderate',
          reason: `This $${currentAmount.toFixed(2)} ${transaction.category} expense is unusually large`,
          comparison: `Transactions over $500 are uncommon and flagged for review`
        };
      }

      // RULE 2: Category/merchant mismatches are always anomalies
      const categoryMismatches = [
        { category: 'dining', merchants: ['bunnings', 'hardware', 'officeworks', 'kmart', 'target', 'woolworths', 'coles'] },
        { category: 'transport', merchants: ['restaurant', 'cafe', 'dining', 'food'] },
        { category: 'groceries', merchants: ['petrol', 'gas', 'fuel', 'restaurant'] }
      ];

      for (const mismatch of categoryMismatches) {
        if (categoryLower === mismatch.category) {
          for (const suspiciousMerchant of mismatch.merchants) {
            if (merchantLower.includes(suspiciousMerchant)) {
              console.log('AnalysisService: CATEGORY MISMATCH ANOMALY detected:', {
                category: categoryLower,
                merchant: merchantLower,
                suspiciousMerchant
              });
              return {
                isAnomaly: true,
                severity: 'moderate',
                reason: `This appears to be a ${suspiciousMerchant} transaction incorrectly categorized as ${transaction.category}`,
                comparison: `${transaction.merchant} doesn't match the ${transaction.category} category`
              };
            }
          }
        }
      }

      // RULE 3: Statistical analysis for remaining transactions
      const categoryTransactions = historicalTransactions.filter(t =>
        t.category === transaction.category && 
        t.amount < 0 && 
        t._id.toString() !== transaction._id.toString() // Exclude the current transaction
      );

      console.log('AnalysisService: Historical transactions analysis:', {
        totalHistorical: historicalTransactions.length,
        categoryTransactions: categoryTransactions.length,
        category: transaction.category
      });

      // If we don't have enough historical data, use general expense analysis
      if (categoryTransactions.length < 3) {
        console.log('AnalysisService: NOT ENOUGH category-specific historical data');

        // Use all expense transactions for comparison
        const allExpenseTransactions = historicalTransactions.filter(t => 
          t.amount < 0 && 
          t._id.toString() !== transaction._id.toString()
        );

        console.log('AnalysisService: Using all expense transactions for comparison:', allExpenseTransactions.length);

        if (allExpenseTransactions.length >= 5) {
          const amounts = allExpenseTransactions.map(t => Math.abs(t.amount));
          const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
          const maxAmount = Math.max(...amounts);

          console.log('AnalysisService: General expense analysis:', {
            currentAmount,
            avgAmount,
            maxAmount,
            ratio: currentAmount / avgAmount
          });

          // Flag if significantly larger than average
          if (currentAmount > avgAmount * 3 && currentAmount > 100) {
            console.log('AnalysisService: ANOMALY DETECTED based on general spending pattern');
            return {
              isAnomaly: true,
              severity: currentAmount > avgAmount * 5 ? 'major' : 'moderate',
              reason: `This expense is unusually high compared to your typical spending patterns`,
              comparison: `This $${currentAmount.toFixed(2)} expense is much higher than your average expense of $${avgAmount.toFixed(2)}`
            };
          }
        }

        console.log('AnalysisService: NO ANOMALY detected - insufficient data and not obviously unusual');
        return { isAnomaly: false };
      }

      // Statistical analysis with sufficient category data
      const amounts = categoryTransactions.map(t => Math.abs(t.amount));
      const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const maxAmount = Math.max(...amounts);
      const minAmount = Math.min(...amounts);

      console.log('AnalysisService: Category-specific statistical analysis:', {
        currentAmount,
        avgAmount,
        maxAmount,
        minAmount,
        ratio: currentAmount / avgAmount,
        historicalCount: amounts.length
      });

      // Calculate standard deviation
      const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - avgAmount, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      console.log('AnalysisService: Statistical measures:', {
        variance: variance.toFixed(2),
        stdDev: stdDev.toFixed(2)
      });

      let isAnomaly = false;
      let severity = 'minor';
      let reason = '';

      // More aggressive thresholds
      if (currentAmount > avgAmount * 4 && currentAmount > maxAmount * 1.5) {
        isAnomaly = true;
        severity = 'major';
        reason = `This ${transaction.category} expense is highly unusual - ${Math.round(currentAmount / avgAmount)}x your typical spending`;
      } else if (currentAmount > avgAmount * 3 && currentAmount > avgAmount + (2 * stdDev)) {
        isAnomaly = true;
        severity = 'moderate';
        reason = `This ${transaction.category} expense is significantly higher than usual`;
      } else if (currentAmount > avgAmount * 2.5 && currentAmount > avgAmount + stdDev && currentAmount > 50) {
        isAnomaly = true;
        severity = 'minor';
        reason = `This ${transaction.category} expense is above your normal range`;
      }

      // Don't flag very small amounts unless they're really unusual
      if (currentAmount < 25 && Math.abs(currentAmount - avgAmount) < 20) {
        console.log('AnalysisService: OVERRIDING anomaly detection for small amount');
        isAnomaly = false;
      }

      const result = {
        isAnomaly,
        severity,
        reason,
        comparison: `You usually spend $${avgAmount.toFixed(2)} on ${transaction.category}, this was $${currentAmount.toFixed(2)}`,
        expectedRange: {
          min: parseFloat(minAmount.toFixed(2)),
          max: parseFloat(maxAmount.toFixed(2)),
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