const { randomUUID } = require('crypto');

const User = require('../models/User.js');
const { generatePasswordHash, validatePassword } = require('../utils/password.js');

class UserService {
  static async list() {
    try {
      return User.find();
    } catch (err) {
      throw new Error(`Database error while listing users: ${err}`);
    }
  }

  static async get(id) {
    try {
      return User.findOne({ _id: id }).exec();
    } catch (err) {
      throw new Error(`Database error while getting the user by their ID: ${err}`);
    }
  }

  static async getByEmail(email) {
    try {
      return User.findOne({ email }).exec();
    } catch (err) {
      throw new Error(`Database error while getting the user by their email: ${err}`);
    }
  }

  static async update(id, data) {
    try {
      console.log('UserService: Updating user with ID:', id);
      console.log('UserService: Update data received:', data);

      // If switching to business account, validate required fields
      if (data.accountType === 'business') {
        console.log('UserService: Switching to business account, validating fields');
        
        const currentUser = await User.findOne({ _id: id }).exec();
        if (!currentUser) {
          throw new Error('User not found');
        }

        // Check if required business fields are provided or already exist
        const companyName = data.companyName || currentUser.companyName;
        const companySize = data.companySize || currentUser.companySize;
        const industry = data.industry || currentUser.industry;

        if (!companyName || !companySize || !industry) {
          console.log('UserService: Missing required business fields');
          throw new Error('Company name, size, and industry are required for business accounts');
        }

        // Ensure business fields are included in the update
        data.companyName = companyName;
        data.companySize = companySize;
        data.industry = industry;

        console.log('UserService: Business account validation passed');
      }

      // If switching to personal account, we can clear business fields
      if (data.accountType === 'personal') {
        console.log('UserService: Switching to personal account');
        data.companyName = undefined;
        data.companySize = undefined;
        data.industry = undefined;
      }

      const updatedUser = await User.findOneAndUpdate({ _id: id }, data, { new: true, upsert: false });
      console.log('UserService: User updated successfully');
      
      return updatedUser;
    } catch (err) {
      console.error('UserService: Error updating user:', err.message);
      throw new Error(`Database error while updating user ${id}: ${err}`);
    }
  }

  static async delete(id) {
    try {
      const result = await User.deleteOne({ _id: id }).exec();
      return (result.deletedCount === 1);
    } catch (err) {
      throw new Error(`Database error while deleting user ${id}: ${err}`);
    }
  }

  static async deleteByEmail(email) {
    try {
      const result = await User.deleteOne({ email }).exec();
      return (result.deletedCount === 1);
    } catch (err) {
      throw new Error(`Database error while deleting user by email ${email}: ${err}`);
    }
  }

  static async authenticateWithPassword(email, password) {
    if (!email) throw new Error('Email is required');
    if (!password) throw new Error('Password is required');

    try {
      const user = await User.findOne({email}).exec();
      if (!user) return null;

      const passwordValid = await validatePassword(password, user.password);
      if (!passwordValid) return null;

      user.lastLoginAt = Date.now();
      const updatedUser = await user.save();
      return updatedUser;
    } catch (err) {
      throw new Error(`Database error while authenticating user ${email} with password: ${err}`);
    }
  }

  static async create({ email, password, name = '', accountType, companyName, companySize, industry }) {
    console.log('UserService: Creating user with account type:', accountType);

    if (!email) throw new Error('Email is required');
    if (!password) throw new Error('Password is required');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Set default account type if not provided
    const finalAccountType = accountType || 'personal';
    console.log('UserService: Final account type:', finalAccountType);

    // Validate business account fields
    if (finalAccountType === 'business') {
      console.log('UserService: Validating business account fields');
      if (!companyName) throw new Error('Company name is required for business accounts');
      if (!companySize) throw new Error('Company size is required for business accounts');
      if (!industry) throw new Error('Industry is required for business accounts');
      console.log('UserService: Business account validation passed');
    }

    const existingUser = await UserService.getByEmail(email);
    if (existingUser) throw new Error('User with this email already exists');

    const hash = await generatePasswordHash(password);

    try {
      const userData = {
        email,
        password: hash,
        name,
        accountType: finalAccountType,
        onboardingCompleted: false,
      };

      console.log('UserService: Creating user with data:', {
        ...userData,
        password: '[HIDDEN]'
      });

      // Add business-specific fields if account type is business
      if (finalAccountType === 'business') {
        userData.companyName = companyName;
        userData.companySize = companySize;
        userData.industry = industry;
        console.log('UserService: Added business fields to user data');
      }

      const user = new User(userData);
      await user.save();

      console.log('UserService: User created successfully with account type:', user.accountType);
      return user;
    } catch (err) {
      console.error(`UserService: Error creating user: ${err.message}`);
      throw new Error(`Database error while creating new user: ${err}`);
    }
  }

  static async setPassword(user, password) {
    if (!password) throw new Error('Password is required');
    user.password = await generatePasswordHash(password); // eslint-disable-line

    try {
      if (!user.isNew) {
        await user.save();
      }

      return user;
    } catch (err) {
      throw new Error(`Database error while setting user password: ${err}`);
    }
  }
}

module.exports = UserService;