import { Request, Response } from 'express';
import User from '../models/User';
import Article from '../models/Article';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.session.user?.role;
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    
    // Basic stats visible to both roles
    const articleCount = await Article.countDocuments({ isDeleted: { $ne: true } });
    const publishedArticleCount = await Article.countDocuments({ 
      status: 'PUBLISHED', 
      isDeleted: { $ne: true } 
    });
    const activeSessions = 1; 

    const stats: any = {
      articleCount,
      publishedArticleCount,
      activeSessions
    };

    // Only fetch and return user counts for SUPER_ADMIN
    if (isSuperAdmin) {
      stats.superAdminCount = await User.countDocuments({ role: 'SUPER_ADMIN' });
      stats.adminCount = await User.countDocuments({ role: 'ADMIN' });
    }

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching stats' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ 
        message: 'Email đã được sử dụng bởi một tài khoản khác',
        code: 'EMAIL_ALREADY_EXISTS'
      });
      return;
    }

    // Create user (password hashing is handled by model middleware)
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    if (user) {
      res.status(201).json({ message: 'Tạo tài khoản quản lý thành công' });
    } else {
      res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống khi tạo tài khoản' });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, sort, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    
    let query: any = { role: { $in: ['ADMIN', 'GUEST'] } };

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { role: searchRegex }
      ];
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const sortOrder = sort === 'asc' ? 1 : -1;
    
    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query, '-password')
      .sort({ createdAt: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    
    const hasNextPage = pageNum * limitNum < totalUsers;

    res.status(200).json({
      users: users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || 'ACTIVE',
        createdAt: user.createdAt.toISOString().split('T')[0]
      })),
      hasNextPage,
      nextPage: hasNextPage ? pageNum + 1 : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống khi lấy danh sách người dùng' });
  }
};

export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!status || !['ACTIVE', 'INACTIVE', 'PENDING'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Do not allow self-inactivation if they are the current logged-in user
    if (req.session.user?.id === id) {
      res.status(400).json({ message: 'Cannot deactivate your own account' });
      return;
    }

    user.status = status;
    await user.save();

    res.status(200).json({ message: 'Status updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating status' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Prevent deleting super admin or self
    if (req.session.user?.id === id) {
      res.status(400).json({ message: 'Cannot delete your own account' });
      return;
    }
    
    if (user.role === 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Super Administrators cannot be deleted' });
      return;
    }

    await User.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting user' });
  }
};
