const Policy = require('../models/Policy');
const PolicyViolation = require('../models/PolicyViolation');
const path = require('path');
const fs = require('fs').promises;

class PolicyDatabaseService {
  
  static async createPolicy(userId, policyData) {
    console.log('PolicyDatabaseService: ===== CREATING POLICY =====');
    console.log('PolicyDatabaseService: Creating policy for user:', userId);
    console.log('PolicyDatabaseService: Policy data received:', JSON.stringify(policyData, null, 2));
    console.log('PolicyDatabaseService: Daily limits in policy data:', policyData.dailyLimits);

    try {
      // Deactivate existing policies
      await Policy.updateMany(
        { userId, status: 'active' },
        { $set: { status: 'inactive' } }
      );
      console.log('PolicyDatabaseService: Deactivated existing policies');

      const policy = new Policy({
        userId,
        ...policyData,
        status: 'active'
      });

      console.log('PolicyDatabaseService: Policy object before save:', {
        dailyLimits: policy.dailyLimits,
        title: policy.title,
        status: policy.status
      });

      const savedPolicy = await policy.save();
      
      console.log('PolicyDatabaseService: ===== POLICY SAVED =====');
      console.log('PolicyDatabaseService: Policy saved successfully:', {
        id: savedPolicy._id,
        dailyLimits: savedPolicy.dailyLimits,
        status: savedPolicy.status
      });
      console.log('PolicyDatabaseService: Saved dining limit:', savedPolicy.dailyLimits.dining);
      console.log('PolicyDatabaseService: Saved transport limit:', savedPolicy.dailyLimits.transport);
      console.log('PolicyDatabaseService: Saved entertainment limit:', savedPolicy.dailyLimits.entertainment);
      console.log('PolicyDatabaseService: ===== END POLICY SAVED =====');

      return savedPolicy;
    } catch (error) {
      console.error('PolicyDatabaseService: Error creating policy:', error.message);
      throw new Error(`Failed to create policy: ${error.message}`);
    }
  }

  static async getPolicies(userId, filters = {}) {
    console.log('=== POLICY DATABASE GET POLICIES START ===');
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

      console.log('PolicyDatabaseService: Query being executed:', query);
      
      const policies = await Policy.find(query)
        .sort({ effectiveDate: -1 })
        .lean();

      console.log('PolicyDatabaseService: Query completed');
      console.log('PolicyDatabaseService: Found', policies.length, 'policies');
      
      if (policies.length > 0) {
        console.log('PolicyDatabaseService: Policy details:');
        policies.forEach((policy, index) => {
          console.log(`PolicyDatabaseService: Policy ${index + 1}:`, {
            id: policy._id,
            title: policy.title,
            status: policy.status,
            dailyLimits: policy.dailyLimits,
            isDeleted: policy.isDeleted,
            effectiveDate: policy.effectiveDate
          });
        });
      } else {
        console.log('PolicyDatabaseService: No policies found in database');
      }

      console.log('=== POLICY DATABASE GET POLICIES END ===');
      return policies;
    } catch (error) {
      console.error('=== POLICY DATABASE GET POLICIES ERROR ===');
      console.error('PolicyDatabaseService: Error fetching policies:', error.message);
      console.error('PolicyDatabaseService: Error stack:', error.stack);
      console.error('=== END POLICY DATABASE GET POLICIES ERROR ===');
      throw new Error(`Failed to fetch policies: ${error.message}`);
    }
  }

  static async getPolicyById(policyId, userId) {
    console.log('PolicyDatabaseService: Fetching policy:', policyId);
    
    try {
      const policy = await Policy.findOne({ 
        _id: policyId, 
        userId, 
        isDeleted: false 
      }).lean();

      if (!policy) {
        throw new Error('Policy not found');
      }

      return policy;
    } catch (error) {
      console.error('PolicyDatabaseService: Error fetching policy:', error.message);
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
    console.log('PolicyDatabaseService: deletePolicy called');
    console.log('PolicyDatabaseService: policyId:', policyId);
    console.log('PolicyDatabaseService: userId:', userId);

    try {
      console.log('PolicyDatabaseService: About to find and update policy with soft delete');
      const policy = await Policy.findOneAndUpdate(
        { _id: policyId, userId, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
      );

      console.log('PolicyDatabaseService: Policy findOneAndUpdate result:', policy);

      if (!policy) {
        console.log('PolicyDatabaseService: Policy not found or already deleted');
        throw new Error('Policy not found');
      }

      console.log('PolicyDatabaseService: Policy deleted successfully, ID:', policy._id);
      return policy;
    } catch (error) {
      console.error('PolicyDatabaseService: Error deleting policy:', error.message);
      console.error('PolicyDatabaseService: Full error:', error);
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
        severity: violationData.severity || 'Minor'
      });

      const savedViolation = await violation.save();
      console.log('PolicyDatabaseService: Violation created successfully:', savedViolation._id);
      
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
    console.log('PolicyDatabaseService: Updating violation justification:', violationId);
    
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
        return null;
      }

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

      console.log('PolicyDatabaseService: Policy overview generated successfully');
      return overview;
    } catch (error) {
      console.error('PolicyDatabaseService: Error generating policy overview:', error.message);
      throw new Error(`Failed to generate policy overview: ${error.message}`);
    }
  }
}

module.exports = PolicyDatabaseService;