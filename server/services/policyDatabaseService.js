const Policy = require('../models/Policy');
const PolicyViolation = require('../models/PolicyViolation');
const path = require('path');
const fs = require('fs').promises;

class PolicyDatabaseService {

  static async createPolicy(userId, policyData) {
    console.log('PolicyDatabaseService: Creating policy for user:', userId);
    console.log('PolicyDatabaseService: Policy data:', {
      title: policyData.title,
      dailyLimits: policyData.dailyLimits,
      status: policyData.status || 'active'
    });

    try {
      // Deactivate existing policies
      const deactivatedCount = await Policy.updateMany(
        { userId, status: 'active', isDeleted: false },
        { $set: { status: 'inactive' } }
      );
      console.log('PolicyDatabaseService: Deactivated', deactivatedCount.modifiedCount, 'existing policies');

      // Ensure all required fields are present
      const completeData = {
        userId,
        title: policyData.title || 'Company Policy',
        description: policyData.description || 'Company spending policy',
        effectiveDate: policyData.effectiveDate || new Date(),
        documentPath: policyData.documentPath,
        documentOriginalName: policyData.documentOriginalName,
        dailyLimits: {
          dining: policyData.dailyLimits?.dining || 50,
          transport: policyData.dailyLimits?.transport || 100,
          entertainment: policyData.dailyLimits?.entertainment || 75,
          shopping: policyData.dailyLimits?.shopping || 200,
          groceries: policyData.dailyLimits?.groceries || 75,
          healthcare: policyData.dailyLimits?.healthcare || 200,
          utilities: policyData.dailyLimits?.utilities || 150,
          other: policyData.dailyLimits?.other || 50
        },
        restrictedCategories: policyData.restrictedCategories || [],
        approvalRequired: policyData.approvalRequired || ['entertainment'],
        status: 'active',
        isDeleted: false
      };

      console.log('PolicyDatabaseService: Creating policy with complete data:', {
        title: completeData.title,
        dailyLimits: completeData.dailyLimits,
        status: completeData.status
      });

      const policy = new Policy(completeData);
      const savedPolicy = await policy.save();

      console.log('PolicyDatabaseService: Policy saved successfully with ID:', savedPolicy._id);
      console.log('PolicyDatabaseService: Saved daily limits:', savedPolicy.dailyLimits);

      return savedPolicy;
    } catch (error) {
      console.error('PolicyDatabaseService: Error creating policy:', error.message);
      console.error('PolicyDatabaseService: Error stack:', error.stack);
      throw new Error(`Failed to create policy: ${error.message}`);
    }
  }

  static async getPolicies(userId, filters = {}) {
    console.log('PolicyDatabaseService: Fetching policies for user:', userId);
    console.log('PolicyDatabaseService: Filters:', filters);

    try {
      const query = {
        userId,
        isDeleted: false
      };

      if (filters.status) {
        query.status = filters.status;
      }

      console.log('PolicyDatabaseService: Query:', query);

      const policies = await Policy.find(query)
        .sort({ effectiveDate: -1 })
        .lean();

      console.log('PolicyDatabaseService: Found', policies.length, 'policies');

      if (policies.length > 0) {
        policies.forEach((policy, index) => {
          console.log(`PolicyDatabaseService: Policy ${index + 1}:`, {
            id: policy._id,
            title: policy.title,
            status: policy.status,
            effectiveDate: policy.effectiveDate,
            dailyLimits: policy.dailyLimits
          });
        });
      }

      return policies;
    } catch (error) {
      console.error('PolicyDatabaseService: Error fetching policies:', error.message);
      throw new Error(`Failed to fetch policies: ${error.message}`);
    }
  }

  static async getPolicyById(policyId, userId) {
    console.log('PolicyDatabaseService: Fetching policy by ID:', policyId, 'for user:', userId);

    try {
      const policy = await Policy.findOne({
        _id: policyId,
        userId,
        isDeleted: false
      }).lean();

      if (!policy) {
        console.log('PolicyDatabaseService: Policy not found');
        throw new Error('Policy not found');
      }

      console.log('PolicyDatabaseService: Policy found:', policy.title);
      return policy;
    } catch (error) {
      console.error('PolicyDatabaseService: Error fetching policy by ID:', error.message);
      throw new Error(`Failed to fetch policy: ${error.message}`);
    }
  }

  static async updatePolicy(policyId, userId, updateData) {
    console.log('PolicyDatabaseService: Updating policy:', policyId);

    try {
      const policy = await Policy.findOneAndUpdate(
        { _id: policyId, userId, isDeleted: false },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!policy) {
        console.log('PolicyDatabaseService: Policy not found for update');
        throw new Error('Policy not found');
      }

      console.log('PolicyDatabaseService: Policy updated successfully');
      return policy;
    } catch (error) {
      console.error('PolicyDatabaseService: Error updating policy:', error.message);
      throw new Error(`Failed to update policy: ${error.message}`);
    }
  }

  static async deletePolicy(policyId, userId) {
    console.log('PolicyDatabaseService: Deleting policy:', policyId, 'for user:', userId);

    try {
      const policy = await Policy.findOneAndUpdate(
        { _id: policyId, userId, isDeleted: false },
        { $set: { isDeleted: true, status: 'inactive' } },
        { new: true }
      );

      if (!policy) {
        console.log('PolicyDatabaseService: Policy not found for deletion');
        throw new Error('Policy not found');
      }

      console.log('PolicyDatabaseService: Policy deleted successfully');
      return policy;
    } catch (error) {
      console.error('PolicyDatabaseService: Error deleting policy:', error.message);
      throw new Error(`Failed to delete policy: ${error.message}`);
    }
  }

  static async createViolation(userId, violationData) {
    console.log('PolicyDatabaseService: Creating policy violation for user:', userId);

    try {
      const violation = new PolicyViolation({
        userId,
        policyId: violationData.policyId,
        transactionId: violationData.transactionId,
        violationType: violationData.violationType,
        merchant: violationData.merchant,
        amount: violationData.amount,
        date: new Date(violationData.date),
        ruleViolated: violationData.ruleViolated,
        severity: violationData.severity || 'Minor',
        status: 'Needs Review'
      });

      const savedViolation = await violation.save();
      console.log('PolicyDatabaseService: Violation created with ID:', savedViolation._id);

      return savedViolation;
    } catch (error) {
      console.error('PolicyDatabaseService: Error creating violation:', error.message);
      throw new Error(`Failed to create violation: ${error.message}`);
    }
  }

  static async getViolations(userId, filters = {}) {
    console.log('PolicyDatabaseService: Fetching violations for user:', userId);

    try {
      const query = { userId };

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.severity) {
        query.severity = filters.severity;
      }

      const violations = await PolicyViolation.find(query)
        .populate('policyId', 'title')
        .sort({ date: -1 })
        .lean();

      console.log('PolicyDatabaseService: Found', violations.length, 'violations');
      return violations;
    } catch (error) {
      console.error('PolicyDatabaseService: Error fetching violations:', error.message);
      throw new Error(`Failed to fetch violations: ${error.message}`);
    }
  }

  static async updateViolationJustification(violationId, userId, justification, documents = []) {
    console.log('PolicyDatabaseService: Updating violation justification for ID:', violationId);

    try {
      const violation = await PolicyViolation.findOneAndUpdate(
        { _id: violationId, userId },
        {
          $set: {
            justification,
            justificationDate: new Date(),
            documents,
            status: 'Pending Approval'
          }
        },
        { new: true }
      );

      if (!violation) {
        console.log('PolicyDatabaseService: Violation not found for justification update');
        throw new Error('Violation not found');
      }

      console.log('PolicyDatabaseService: Violation justification updated successfully');
      return violation;
    } catch (error) {
      console.error('PolicyDatabaseService: Error updating violation justification:', error.message);
      throw new Error(`Failed to update violation justification: ${error.message}`);
    }
  }

  static async getPolicyOverview(userId) {
    console.log('PolicyDatabaseService: Generating policy overview for user:', userId);

    try {
      // Get active policy
      const activePolicy = await Policy.findOne({
        userId,
        status: 'active',
        isDeleted: false
      }).lean();

      if (!activePolicy) {
        console.log('PolicyDatabaseService: No active policy found');
        return null;
      }

      console.log('PolicyDatabaseService: Active policy found:', activePolicy.title);

      // Get violation statistics
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      const [violationsThisMonth, pendingApprovals, totalViolations] = await Promise.all([
        PolicyViolation.countDocuments({
          userId,
          date: { $gte: monthStart }
        }),
        PolicyViolation.countDocuments({
          userId,
          status: 'Pending Approval'
        }),
        PolicyViolation.countDocuments({ userId })
      ]);

      console.log('PolicyDatabaseService: Violation stats:', {
        thisMonth: violationsThisMonth,
        pending: pendingApprovals,
        total: totalViolations
      });

      // Calculate compliance percentage
      const complianceRate = totalViolations > 0 ?
        Math.max(0, 100 - (violationsThisMonth * 10)) : 100;

      const overview = {
        lastUpdated: activePolicy.updatedAt,
        overallCompliance: Math.round(complianceRate),
        dailyLimits: activePolicy.dailyLimits,
        restrictedCategories: activePolicy.restrictedCategories,
        approvalRequired: activePolicy.approvalRequired,
        violationsThisMonth,
        pendingApprovals
      };

      console.log('PolicyDatabaseService: Policy overview generated with compliance:', overview.overallCompliance);
      return overview;
    } catch (error) {
      console.error('PolicyDatabaseService: Error generating policy overview:', error.message);
      throw new Error(`Failed to generate policy overview: ${error.message}`);
    }
  }
}

module.exports = PolicyDatabaseService;