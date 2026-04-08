import { Request, Response } from 'express';
import Article from '../models/Article';
import mongoose from 'mongoose';

export const createArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, content, thumbnail, status } = req.body;
    const poster = req.session.user?.id;

    const userRole = req.session.user?.role;
    const userPermissions = req.session.user?.permissions || [];

    if (userRole !== 'SUPER_ADMIN' && !userPermissions.includes('CREATE')) {
      res.status(403).json({ message: 'Bạn không có quyền tạo bài viết mới.' });
      return;
    }

    // ADMIN can only create DRAFT or PENDING. Default to DRAFT.
    let finalStatus = status || 'DRAFT';
    if (userRole === 'ADMIN' && !['DRAFT', 'PENDING'].includes(finalStatus)) {
      finalStatus = 'DRAFT';
    }

    const article = await Article.create({
      title,
      description,
      content,
      thumbnail,
      status: finalStatus,
      poster
    });

    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error creating article' });
  }
};

export const getArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, sort, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const userId = req.session.user?.id;
    const userRole = req.session.user?.role;
    const userPermissions = req.session.user?.permissions || [];

    let query: any = { isDeleted: { $ne: true } };

    // Apply VIEW permission restriction first
    if (userRole !== 'SUPER_ADMIN' && !userPermissions.includes('VIEW')) {
      query.poster = new mongoose.Types.ObjectId(userId);
    } else {
      // Normal Visibility logic: Others' DRAFTS are hidden
      const visibilityQuery = {
        $or: [
          { status: { $in: ['PENDING', 'PUBLISHED', 'UNPUBLISHED'] } },
          { poster: userId } // Creator can see their own (including DRAFT)
        ]
      };
      query = { $and: [query, visibilityQuery] };
    }

    if (search) {
      query.title = new RegExp(search as string, 'i');
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const sortOrder = sort === 'asc' ? 1 : -1;

    const totalArticles = await Article.countDocuments(query);
    const articles = await Article.find(query)
      .populate('poster', 'name email')
      .sort({ createdAt: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const hasNextPage = pageNum * limitNum < totalArticles;

    res.status(200).json({
      articles,
      hasNextPage,
      nextPage: hasNextPage ? pageNum + 1 : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles' });
  }
};

export const getArticleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const article = await Article.findById(id).populate('poster', 'name email');

    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    const userId = req.session.user?.id;
    const userRole = req.session.user?.role;
    const userPermissions = req.session.user?.permissions || [];

    // General Visibility Check: if no VIEW permission, can only see own article.
    if (userRole !== 'SUPER_ADMIN' && !userPermissions.includes('VIEW') && article.poster?._id?.toString() !== userId) {
      res.status(403).json({ message: 'Bạn không có quyền xem bài viết của người khác.' });
      return;
    }

    // Visibility Check: Prevent direct access to others' DRAFTS
    if (article.status === 'DRAFT' && article.poster?._id?.toString() !== userId) {
      res.status(403).json({ message: 'Access denied to this draft article' });
      return;
    }

    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching article detail' });
  }
};

export const updateArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, content, thumbnail, status } = req.body;

    const article = await Article.findById(id);

    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    const userRole = req.session.user?.role;
    const userPermissions = req.session.user?.permissions || [];
    const isOwner = article.poster.toString() === req.session.user?.id;

    // ADMIN cannot edit a published article
    if (userRole === 'ADMIN' && article.status === 'PUBLISHED') {
      res.status(403).json({ message: 'You cannot edit a published article' });
      return;
    }

    if (userRole === 'ADMIN') {
      const hasEditPerm = userPermissions.includes('EDIT');
      const isUnpublished = article.status === 'UNPUBLISHED';

      // Can edit if it is their own article OR (they have EDIT permission AND article is UNPUBLISHED)
      if (!isOwner && !(hasEditPerm && isUnpublished)) {
        res.status(403).json({ message: 'You can only edit your own articles or unpublished articles with the EDIT permission' });
        return;
      }
    }

    let finalStatus = status || article.status;
    if (userRole === 'ADMIN' && status) {
      if (!['DRAFT', 'PENDING'].includes(status)) {
        finalStatus = article.status; // Ignore invalid status change
      }
    }

    article.title = title || article.title;
    article.description = description || article.description;
    article.content = content || article.content;
    article.thumbnail = thumbnail || article.thumbnail;
    article.status = finalStatus;
    article.updatedAt = new Date();

    await article.save();

    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error updating article' });
  }
};

export const updateArticleStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const article = await Article.findById(id);
    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    const userRole = req.session.user?.role;
    const userId = req.session.user?.id;
    const userPermissions = req.session.user?.permissions || [];


    if (userRole === 'ADMIN') {
      const hasTogglePerm = userPermissions.includes('PUBLISH_TOGGLE');
      const isTargetingPublish = ['PUBLISHED', 'UNPUBLISHED'].includes(status);
      const isOwner = article.poster.toString() === userId;

      // Logic: 
      // 1. Nếu có quyền TOGGLE và đang gỡ/đăng bài -> Cho phép (mọi bài viết)
      // 2. Nếu là chủ bài viết và đang gửi duyệt/thu hồi -> Cho phép (DRAFT/PENDING)
      if (hasTogglePerm && isTargetingPublish) {
        // Allowed
      } else if (isOwner && ['DRAFT', 'PENDING'].includes(status)) {
        // Allowed
      } else {
        res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' });
        return;
      }
    }
    // --- Lifecycle Protection Logic ---

    // 1. Chặn thu hồi trực tiếp: PUBLISHED -> DRAFT
    if (status === 'DRAFT' && article.status === 'PUBLISHED') {
      res.status(400).json({
        message: 'Bài viết đang xuất bản không thể thu hồi trực tiếp về bản nháp.',
        code: 'REVOKE_PUBLISHED_FORBIDDEN'
      });
      return;
    }

    // 2. Chặn duyệt bài đã thu hồi: DRAFT -> PUBLISHED (SA duyệt bài Admin)
    if (status === 'PUBLISHED' && article.status === 'DRAFT') {
      res.status(400).json({
        message: 'Bài viết này đã được Admin thu hồi hoặc đang trong trạng thái Nháp. Bạn không thể duyệt lúc này.',
        code: 'APPROVE_REVOKED_FORBIDDEN'
      });
      return;
    }

    article.status = status;
    article.updatedAt = new Date();
    await article.save();

    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error updating article status' });
  }
};

export const deleteArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    const article = await Article.findById(id);

    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    // Permission Check
    const isOwner = article.poster.toString() === user?.id;
    const isSA = user?.role === 'SUPER_ADMIN';
    const hasDeletePerm = user?.permissions?.includes('DELETE');

    if (article.status === 'PUBLISHED' || article.status === 'PENDING') {
      res.status(403).json({ message: 'Không thể xóa bài viết đang xuất bản hoặc chờ duyệt.' });
      return;
    }

    let canDelete = false;

    if (article.status === 'DRAFT' && isOwner) {
      canDelete = true;
    }

    if (article.status === 'UNPUBLISHED') {
      if (isSA || hasDeletePerm) {
        canDelete = true;
      }
    }

    if (!canDelete) {
      res.status(403).json({ message: 'Bạn không có quyền xóa bài viết này.' });
      return;
    }

    // Soft Delete
    article.isDeleted = true;
    article.deletedAt = new Date();
    article.deletedBy = new (mongoose.Types.ObjectId as any)(user?.id);
    await article.save();

    res.status(200).json({ message: 'Article moved to trash' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting article' });
  }
};

export const getTrash = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.session.user;
    const { search, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    let query: any = {
      isDeleted: true,
      $or: [
        { status: { $in: ['PUBLISHED', 'UNPUBLISHED'] } },
        { status: 'DRAFT', poster: user?.id }
      ]
    };

    if (search) {
      query.title = new RegExp(search as string, 'i');
    }

    const total = await Article.countDocuments(query);
    const articles = await Article.find(query)
      .populate('poster', 'name email')
      .populate('deletedBy', 'name email')
      .sort({ deletedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const hasNextPage = pageNum * limitNum < total;

    res.status(200).json({
      articles,
      hasNextPage,
      nextPage: hasNextPage ? pageNum + 1 : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trash' });
  }
};

export const restoreArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    const isSA = user?.role === 'SUPER_ADMIN';
    const hasDeletePerm = user?.permissions?.includes('DELETE');

    let query: any = { _id: id, isDeleted: true };
    if (!isSA && !hasDeletePerm) {
      query.deletedBy = user?.id;
    }

    const article = await Article.findOne(query);

    if (!article) {
      res.status(404).json({ message: 'Article not found in trash' });
      return;
    }

    article.isDeleted = false;
    article.deletedAt = null;
    article.deletedBy = null;
    await article.save();

    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error restoring article' });
  }
};

export const permanentDelete = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    const isSA = user?.role === 'SUPER_ADMIN';
    const hasDeletePerm = user?.permissions?.includes('DELETE');

    let query: any = { _id: id, isDeleted: true };
    if (!isSA && !hasDeletePerm) {
      query.deletedBy = user?.id;
    }

    const article = await Article.findOne(query);

    if (!article) {
      res.status(404).json({ message: 'Article not found in trash' });
      return;
    }

    await Article.findByIdAndDelete(id);

    res.status(200).json({ message: 'Article permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error permanently deleting article' });
  }
};

export const getPublishedArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const query = {
      status: 'PUBLISHED',
      isDeleted: { $ne: true }
    };

    const total = await Article.countDocuments(query);
    const articles = await Article.find(query)
      .populate('poster', 'name') // Only show name for public
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const hasNextPage = pageNum * limitNum < total;

    res.status(200).json({
      articles,
      hasNextPage,
      nextPage: hasNextPage ? pageNum + 1 : null,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching public articles' });
  }
};

export const getArticleBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const article = await Article.findOne({
      slug,
      status: 'PUBLISHED',
      isDeleted: { $ne: true }
    }).populate('poster', 'name');

    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching article detail' });
  }
};

