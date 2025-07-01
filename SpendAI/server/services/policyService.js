const PolicyDatabaseService = require('./policyDatabaseService');

class PolicyService {
  // Get policy rules for a user (now fetches from database)
  static async getPolicyRules(userId, accountType) {
    console.log('=== POLICY SERVICE GET RULES START ===');
    console.log('PolicyService: Getting policy rules for user:', userId, 'account type:', accountType);

    if (accountType !== 'business') {
      console.log('PolicyService: Personal account - no policy restrictions');
      console.log('=== POLICY SERVICE GET RULES END (PERSONAL) ===');
      return null;
    }

    try {
      console.log('PolicyService: Fetching policies from database...');
      const policies = await PolicyDatabaseService.getPolicies(userId, { status: 'active' });
      console.log('PolicyService: Database query completed');
      console.log('PolicyService: Found policies count:', policies ? policies.length : 0);

      if (policies && policies.length > 0) {
        console.log('PolicyService: Policy details found:');
        policies.forEach((policy, index) => {
          console.log(`PolicyService: Policy ${index + 1}:`, {
            id: policy._id,
            title: policy.title,
            status: policy.status,
            dailyLimits: policy.dailyLimits,
            createdAt: policy.createdAt,
            effectiveDate: policy.effectiveDate
          });
          console.log(`PolicyService: Policy ${index + 1} dining limit:`, policy.dailyLimits?.dining);
        });
      }

      if (!policies || policies.length === 0) {
        console.log('PolicyService: No active policies found, using default rules');
        const defaultRules = {
          dailyLimits: {
            dining: 50,
            transport: 100,
            entertainment: 75,
            shopping: 200,
            groceries: 75,
            healthcare: 200,
            utilities: 150,
            other: 50
          },
          monthlyLimits: {},
          restrictedCategories: [],
          requiresApproval: ['entertainment']
        };
        console.log('PolicyService: Returning default rules:', defaultRules);
        console.log('=== POLICY SERVICE GET RULES END (DEFAULT) ===');
        return defaultRules;
      }

      // Use the most recent active policy
      const activePolicy = policies[0];
      console.log('PolicyService: Using active policy:', activePolicy._id);
      console.log('PolicyService: Active policy title:', activePolicy.title);
      console.log('PolicyService: Raw policy daily limits:', activePolicy.dailyLimits);
      console.log('PolicyService: Active policy dining limit:', activePolicy.dailyLimits?.dining);

      const finalRules = {
        dailyLimits: activePolicy.dailyLimits,
        monthlyLimits: {},
        restrictedCategories: activePolicy.restrictedCategories || [],
        requiresApproval: activePolicy.approvalRequired || ['entertainment']
      };

      console.log('PolicyService: Final rules being returned:', finalRules);
      console.log('PolicyService: Final dining limit:', finalRules.dailyLimits?.dining);
      console.log('=== POLICY SERVICE GET RULES END (ACTIVE POLICY) ===');
      return finalRules;

    } catch (error) {
      console.error('=== POLICY SERVICE GET RULES ERROR ===');
      console.error('PolicyService: Error fetching policy rules:', error.message);
      console.error('PolicyService: Error stack:', error.stack);
      console.error('=== END POLICY SERVICE GET RULES ERROR ===');
      throw error;
    }
  }

  static async checkCompliance(transaction, userAccountType, userTransactions = [], userId = null) {
    console.log('PolicyService: Checking compliance for transaction:', transaction._id || 'new');
    console.log('PolicyService: User account type:', userAccountType);
    console.log('PolicyService: Transaction details:', {
      merchant: transaction.merchant,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date
    });

    if (userAccountType !== 'business') {
      console.log('PolicyService: Personal account - no policy restrictions');
      return {
        status: 'compliant',
        rule: 'No policy restrictions for personal accounts'
      };
    }

    console.log('PolicyService: Business account detected, fetching policy rules...');
    const policyRules = await this.getPolicyRules(userId, userAccountType);
    console.log('PolicyService: Retrieved policy rules:', policyRules);

    if (!policyRules) {
      console.log('PolicyService: No policy rules found');
      return {
        status: 'compliant',
        rule: 'No policy configured'
      };
    }

    const category = transaction.category;
    const amount = Math.abs(transaction.amount);
    const transactionDate = transaction.date;

    console.log('PolicyService: Processing transaction with amount:', amount, 'original amount:', transaction.amount);

    // Check daily limits
    if (policyRules.dailyLimits[category]) {
      const dailyLimit = policyRules.dailyLimits[category];

      // Calculate same-day spending in this category
      const dayStart = new Date(transactionDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(transactionDate);
      dayEnd.setHours(23, 59, 59, 999);

      const sameDayTransactions = userTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= dayStart && tDate <= dayEnd &&
               t.category === category &&
               t._id?.toString() !== transaction._id?.toString();
      });

      console.log('PolicyService: Found', sameDayTransactions.length, 'same-day transactions for category:', category);
      console.log('PolicyService: Same-day transactions details:', sameDayTransactions.map(t => ({
        id: t._id,
        amount: t.amount,
        merchant: t.merchant,
        isExpense: t.amount < 0
      })));

      // Only count expenses (negative amounts) towards spending limits
      // Income (positive amounts) should not count against spending limits
      const sameDayExpenses = sameDayTransactions.filter(t => t.amount < 0);
      const sameDayTotal = sameDayExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      console.log('PolicyService: Same-day expenses only:', sameDayExpenses.map(t => ({
        id: t._id,
        amount: t.amount,
        merchant: t.merchant
      })));
      console.log('PolicyService: Same-day expense total:', sameDayTotal);

      // Only add current transaction to total if it's an expense
      let totalWithCurrent = sameDayTotal;
      if (transaction.amount < 0) {
        totalWithCurrent = sameDayTotal + amount;
        console.log('PolicyService: Current transaction is an expense, adding to total');
      } else {
        console.log('PolicyService: Current transaction is income, not adding to spending total');
      }

      console.log('PolicyService: Daily limit check for', category);
      console.log('PolicyService: - Limit:', dailyLimit);
      console.log('PolicyService: - Same day expense total:', sameDayTotal);
      console.log('PolicyService: - Current amount:', amount, '(original:', transaction.amount, ')');
      console.log('PolicyService: - Total with current:', totalWithCurrent);

      if (totalWithCurrent > dailyLimit) {
        // Create violation record only if we have a policy ID
        if (userId && transaction._id) {
          try {
            // First, try to get or create a default policy for this user
            let defaultPolicy = await PolicyDatabaseService.getPolicies(userId, { status: 'active' });

            if (!defaultPolicy || defaultPolicy.length === 0) {
              // Create a default policy for this business user
              console.log('PolicyService: Creating default policy for business user');
              defaultPolicy = await PolicyDatabaseService.createPolicy(userId, {
                title: 'Default Business Policy',
                description: 'Auto-generated default policy for business account',
                effectiveDate: new Date(),
                dailyLimits: policyRules.dailyLimits,
                restrictedCategories: policyRules.restrictedCategories,
                approvalRequired: policyRules.requiresApproval
              });
              console.log('PolicyService: Default policy created:', defaultPolicy._id);
            } else {
              defaultPolicy = defaultPolicy[0];
            }

            await PolicyDatabaseService.createViolation(userId, {
              policyId: defaultPolicy._id || defaultPolicy.id,
              transactionId: transaction._id,
              violationType: 'daily_limit',
              merchant: transaction.merchant,
              amount: amount,
              date: transactionDate,
              ruleViolated: `Exceeds daily ${category} limit of $${dailyLimit}`,
              severity: 'Major'
            });
            console.log('PolicyService: Created violation record for daily limit breach');
          } catch (error) {
            console.error('PolicyService: Error creating violation record:', error.message);
            // Don't fail the transaction creation if violation record fails
          }
        }

        console.log('PolicyService: VIOLATION - Daily limit exceeded');
        return {
          status: 'violation',
          rule: `Exceeds daily ${category} limit of $${dailyLimit} (total: $${totalWithCurrent.toFixed(2)})`
        };
      }

      // Warning if close to limit (80% or more)
      if (totalWithCurrent >= dailyLimit * 0.8) {
        return {
          status: 'warning',
          rule: `Approaching daily ${category} limit of $${dailyLimit} (total: $${totalWithCurrent.toFixed(2)})`
        };
      }
    }

    // Check if category requires approval
    if (policyRules.requiresApproval.includes(category)) {
      return {
        status: 'warning',
        rule: `${category} expenses require pre-approval`
      };
    }

    // Check restricted categories
    if (policyRules.restrictedCategories.includes(category)) {
      // Create violation record
      if (userId && transaction._id) {
        try {
          await PolicyDatabaseService.createViolation(userId, {
            transactionId: transaction._id,
            violationType: 'restricted_category',
            merchant: transaction.merchant,
            amount: amount,
            date: transactionDate,
            ruleViolated: `${category} expenses are not allowed by company policy`,
            severity: 'Critical'
          });
        } catch (error) {
          console.error('PolicyService: Error creating violation record:', error.message);
        }
      }

      return {
        status: 'violation',
        rule: `${category} expenses are not allowed by company policy`
      };
    }

    console.log('PolicyService: Transaction is compliant');
    return {
      status: 'compliant',
      rule: `Within ${category} spending limits`
    };
  }
}

module.exports = PolicyService;