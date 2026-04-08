import { Request, Response } from 'express';
import User from '../models/User';
import Article from '../models/Article';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.session.user?.role;
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    
    const userId = req.session.user?.id;
    const userPermissions = req.session.user?.permissions || [];

    // Base query for non-deleted articles
    let baseQuery: any = { isDeleted: { $ne: true } };

    // Apply Visibility Logic
    if (userRole !== 'SUPER_ADMIN') {
      if (!userPermissions.includes('VIEW')) {
        // No VIEW permission: only count own articles
        baseQuery.poster = userId;
      } else {
        // Has VIEW permission: count all except others' drafts
        baseQuery = {
          $and: [
            baseQuery,
            {
              $or: [
                { status: { $in: ['PENDING', 'PUBLISHED', 'UNPUBLISHED'] } },
                { poster: userId }
              ]
            }
          ]
        };
      }
    }

    const articleCount = await Article.countDocuments(baseQuery);
    
    // Published count: combine base visibility query with status: 'PUBLISHED'
    const publishedQuery = { 
      ...baseQuery,
      status: 'PUBLISHED'
    };
    
    // If baseQuery had an $and (from VIEW permission), we need to be careful with spreading
    let finalPublishedQuery = publishedQuery;
    if (baseQuery.$and) {
        finalPublishedQuery = {
            $and: [...baseQuery.$and, { status: 'PUBLISHED' }]
        };
    }

    const publishedArticleCount = await Article.countDocuments(finalPublishedQuery);

    const stats: any = {
      articleCount,
      publishedArticleCount
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
      role,
      permissions: ['VIEW'] // default permission
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
        permissions: user.permissions || [],
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

export const updateUserPermissions = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { permissions } = req.body;

  try {
    if (!Array.isArray(permissions)) {
      res.status(400).json({ message: 'Permissions must be an array' });
      return;
    }

    const validPermissions = ['VIEW', 'CREATE', 'PUBLISH_TOGGLE', 'EDIT', 'DELETE'];
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));

    if (invalidPermissions.length > 0) {
      res.status(400).json({ message: `Quyền không hợp lệ: ${invalidPermissions.join(', ')}` });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Prevent modifying super admin permissions entirely
    if (user.role === 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Không thể chỉnh sửa quyền hạn của SUPER_ADMIN' });
      return;
    }

    user.permissions = permissions;
    await user.save();

    res.status(200).json({ message: 'Permissions updated successfully', permissions: user.permissions });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating permissions' });
  }
};
