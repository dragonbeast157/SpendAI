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
    console.log('AnalysisService: Detecting anomalies for user:', userId);

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

      const recentTransactions = await Transaction.find({
        userId,
        isDeleted: false,
        date: { $gte: startDate }
      }).sort({ date: -1 }).lean();

      // Get historical data for comparison (last 3 months)
      const historicalStartDate = new Date(now);
      historicalStartDate.setMonth(now.getMonth() - 3);

      const historicalTransactions = await Transaction.find({
        userId,
        isDeleted: false,
        date: { $gte: historicalStartDate, $lt: startDate }
      }).lean();

      const anomalies = [];

      // Analyze each recent transaction
      for (const transaction of recentTransactions) {
        const anomaly = await this.analyzeTransactionAnomaly(transaction, historicalTransactions);
        if (anomaly.isAnomaly) {
          anomalies.push({
            ...transaction,
            anomalyDetails: anomaly
          });
        }
      }

      // Filter by severity if specified
      let filteredAnomalies = anomalies;
      if (severityLevel !== 'all') {
        filteredAnomalies = anomalies.filter(a => a.anomalyDetails.severity === severityLevel);
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

      console.log('AnalysisService: Anomaly detection completed, found', filteredAnomalies.length, 'anomalies');

      return {
        anomalies: filteredAnomalies,
        summary: {
          total: anomalies.length,
          major: anomalies.filter(a => a.anomalyDetails.severity === 'major').length,
          moderate: anomalies.filter(a => a.anomalyDetails.severity === 'moderate').length,
          minor: anomalies.filter(a => a.anomalyDetails.severity === 'minor').length
        },
        period: dateRange
      };
    } catch (error) {
      console.error('AnalysisService: Error detecting anomalies:', error.message);
      throw new Error(`Failed to detect anomalies: ${error.message}`);
    }
  }

  static async analyzeTransactionAnomaly(transaction, historicalTransactions) {
    try {
      // Get transactions from same category
      const categoryTransactions = historicalTransactions.filter(t => 
        t.category === transaction.category
      );

      if (categoryTransactions.length < 3) {
        return { isAnomaly: false };
      }

      const amounts = categoryTransactions.map(t => Math.abs(t.amount));
      const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const currentAmount = Math.abs(transaction.amount);

      // Calculate standard deviation
      const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - avgAmount, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      // Determine if it's an anomaly and its severity
      const zScore = (currentAmount - avgAmount) / (stdDev || 1);
      
      let isAnomaly = false;
      let severity = 'minor';
      let reason = '';

      if (Math.abs(zScore) > 3) {
        isAnomaly = true;
        severity = 'major';
        reason = `This ${transaction.category} expense is highly unusual - ${Math.round(currentAmount / avgAmount)}x your typical spending`;
      } else if (Math.abs(zScore) > 2) {
        isAnomaly = true;
        severity = 'moderate';
        reason = `This ${transaction.category} expense is significantly higher than usual`;
      } else if (currentAmount > avgAmount * 2) {
        isAnomaly = true;
        severity = 'minor';
        reason = `This ${transaction.category} expense is above your normal range`;
      }

      return {
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
    } catch (error) {
      console.error('AnalysisService: Error analyzing transaction anomaly:', error.message);
      return { isAnomaly: false };
    }
  }

  static formatCategoryName(category) {
    if (!category) return 'Other';
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
}

module.exports = AnalysisService;