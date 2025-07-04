const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');

class UserService {
  static async create(userData) {
    try {
      console.log('UserService: Creating user with data:', { ...userData, password: '[HIDDEN]' });

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = new User({
        ...userData,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        onboardingCompleted: false // Explicitly set to false for new users
      });

      const savedUser = await user.save();
      console.log('UserService: User created successfully:', savedUser.email);

      return savedUser;
    } catch (error) {
      console.error('UserService: Error creating user:', error.message);
      throw error;
    }
  }

  static async authenticateWithPassword(email, password) {
    try {
      console.log('UserService: Authenticating user:', email);

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        console.log('UserService: User not found:', email);
        return null;
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        console.log('UserService: Invalid password for user:', email);
        return null;
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      console.log('UserService: Authentication successful for user:', email);
      return user;
    } catch (error) {
      console.error('UserService: Error authenticating user:', error.message);
      throw error;
    }
  }

  static async getByIdWithPreferences(userId) {
    try {
      console.log('UserService: Getting user by ID with preferences:', userId);

      const user = await User.findById(userId);
      if (!user) {
        console.log('UserService: User not found:', userId);
        return null;
      }

      console.log('UserService: User found:', user.email);
      return user;
    } catch (error) {
      console.error('UserService: Error getting user by ID:', error.message);
      throw error;
    }
  }

  static async getById(userId) {
    try {
      console.log('UserService: Getting user by ID:', userId);

      const user = await User.findById(userId);
      if (!user) {
        console.log('UserService: User not found:', userId);
        return null;
      }

      console.log('UserService: User found:', user.email);
      return user;
    } catch (error) {
      console.error('UserService: Error getting user by ID:', error.message);
      throw error;
    }
  }

  static async update(userId, updateData) {
    try {
      console.log('UserService: Updating user:', userId);
      console.log('UserService: Update data:', updateData);

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      console.log('UserService: User updated successfully:', user.email);
      return user;
    } catch (error) {
      console.error('UserService: Error updating user:', error.message);
      throw error;
    }
  }

  static async delete(userId) {
    try {
      console.log('UserService: Deleting user:', userId);

      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        throw new Error('User not found');
      }

      console.log('UserService: User deleted successfully:', user.email);
      return user;
    } catch (error) {
      console.error('UserService: Error deleting user:', error.message);
      throw error;
    }
  }
}

module.exports = UserService;