const UserService = require('./userService.js');
const TransactionService = require('./transactionService.js');
const BankAccountService = require('./bankAccountService.js');
const PolicyDatabaseService = require('./policyDatabaseService.js');

class SettingsService {
  static async exportUserData(userId, format = 'json') {
    try {
      console.log('SettingsService: Starting data export for user:', userId);

      // Get user data
      const user = await UserService.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get transactions
      let transactions = [];
      try {
        const transactionResult = await TransactionService.getTransactions(userId, {});
        transactions = transactionResult.transactions || [];
      } catch (error) {
        console.log('SettingsService: No transactions found or error fetching transactions:', error.message);
      }

      // Get bank accounts - Fix the method call
      let bankAccounts = [];
      try {
        console.log('SettingsService: Attempting to fetch bank accounts for user:', userId);
        const accountResult = await BankAccountService.getAccounts(userId);
        bankAccounts = accountResult.accounts || [];
        console.log('SettingsService: Successfully fetched bank accounts:', bankAccounts.length);
      } catch (error) {
        console.log('SettingsService: No bank accounts found or error fetching accounts:', error.message);
      }

      // Get policies (for business accounts)
      let policies = [];
      let policyViolations = [];
      if (user.accountType === 'business') {
        try {
          const policyResult = await PolicyDatabaseService.getPolicies(userId);
          policies = policyResult.policies || [];
        } catch (error) {
          console.log('SettingsService: No policies found or error fetching policies:', error.message);
        }

        try {
          const violationResult = await PolicyDatabaseService.getViolations(userId);
          policyViolations = violationResult.violations || [];
        } catch (error) {
          console.log('SettingsService: No policy violations found or error fetching violations:', error.message);
        }
      }

      const exportData = {
        user: {
          email: user.email,
          name: user.name,
          accountType: user.accountType,
          companyName: user.companyName,
          companySize: user.companySize,
          industry: user.industry,
          preferences: user.preferences,
          createdAt: user.createdAt,
          onboardingCompleted: user.onboardingCompleted,
          onboardingCompletedAt: user.onboardingCompletedAt
        },
        transactions: transactions.map(t => ({
          amount: t.amount,
          date: t.date,
          description: t.description,
          merchant: t.merchant,
          category: t.category,
          isAnomaly: t.isAnomaly,
          policyCompliant: t.policyCompliant,
          createdAt: t.createdAt
        })),
        bankAccounts: bankAccounts.map(a => ({
          bankName: a.bankName,
          accountType: a.accountType,
          accountNumber: a.accountNumber ? `****${a.accountNumber.slice(-4)}` : 'N/A',
          status: a.status,
          connectedAt: a.createdAt
        })),
        ...(user.accountType === 'business' && {
          policies: policies.map(p => ({
            title: p.title,
            description: p.description,
            effectiveDate: p.effectiveDate,
            status: p.status,
            createdAt: p.createdAt
          })),
          policyViolations: policyViolations.map(v => ({
            transactionId: v.transactionId,
            violationType: v.violationType,
            severity: v.severity,
            status: v.status,
            createdAt: v.createdAt
          }))
        })
      };

      console.log('SettingsService: Export data prepared, format:', format);

      if (format === 'csv') {
        return this.convertToCSV(exportData);
      }

      return exportData;
    } catch (error) {
      console.error('SettingsService: Error exporting user data:', error.message);
      throw error;
    }
  }

  static convertToCSV(data) {
    console.log('SettingsService: Converting data to CSV format');

    let csv = '';

    // User information
    csv += 'USER INFORMATION\n';
    csv += 'Field,Value\n';
    Object.entries(data.user).forEach(([key, value]) => {
      csv += `${key},"${value}"\n`;
    });
    csv += '\n';

    // Transactions
    csv += 'TRANSACTIONS\n';
    if (data.transactions.length > 0) {
      const transactionHeaders = Object.keys(data.transactions[0]);
      csv += transactionHeaders.join(',') + '\n';
      data.transactions.forEach(transaction => {
        csv += transactionHeaders.map(header => `"${transaction[header] || ''}"`).join(',') + '\n';
      });
    } else {
      csv += 'No transactions found\n';
    }
    csv += '\n';

    // Bank Accounts
    csv += 'BANK ACCOUNTS\n';
    if (data.bankAccounts.length > 0) {
      const accountHeaders = Object.keys(data.bankAccounts[0]);
      csv += accountHeaders.join(',') + '\n';
      data.bankAccounts.forEach(account => {
        csv += accountHeaders.map(header => `"${account[header] || ''}"`).join(',') + '\n';
      });
    } else {
      csv += 'No bank accounts found\n';
    }
    csv += '\n';

    // Policies (for business accounts)
    if (data.policies) {
      csv += 'POLICIES\n';
      if (data.policies.length > 0) {
        const policyHeaders = Object.keys(data.policies[0]);
        csv += policyHeaders.join(',') + '\n';
        data.policies.forEach(policy => {
          csv += policyHeaders.map(header => `"${policy[header] || ''}"`).join(',') + '\n';
        });
      } else {
        csv += 'No policies found\n';
      }
      csv += '\n';

      csv += 'POLICY VIOLATIONS\n';
      if (data.policyViolations.length > 0) {
        const violationHeaders = Object.keys(data.policyViolations[0]);
        csv += violationHeaders.join(',') + '\n';
        data.policyViolations.forEach(violation => {
          csv += violationHeaders.map(header => `"${violation[header] || ''}"`).join(',') + '\n';
        });
      } else {
        csv += 'No policy violations found\n';
      }
    }

    console.log('SettingsService: CSV conversion completed');
    return csv;
  }
}

module.exports = SettingsService;