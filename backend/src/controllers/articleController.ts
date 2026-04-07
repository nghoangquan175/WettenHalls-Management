import { Request, Response } from 'express';
import Article from '../models/Article';
import mongoose from 'mongoose';

export const createArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, content, thumbnail, status } = req.body;
    const poster = req.session.user?.id;

    const article = await Article.create({
      title,
      description,
      content,
      thumbnail,
      status: status || 'DRAFT',
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

    let query: any = { isDeleted: { $ne: true } };

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

    // Optional: Check if the user is the poster or SUPER_ADMIN
    // For now, allow any authenticated ADMIN/SUPER_ADMIN

    article.title = title || article.title;
    article.description = description || article.description;
    article.content = content || article.content;
    article.thumbnail = thumbnail || article.thumbnail;
    article.status = status || article.status;
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

    if (!['DRAFT', 'PENDING', 'PUBLISHED', 'UNPUBLISHED'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const article = await Article.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

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

    if (user?.role === 'ADMIN') {
      // ADMIN only deletes their own DRAFT
      if (!isOwner || article.status !== 'DRAFT') {
        res.status(403).json({ message: 'You can only delete your own draft articles' });
        return;
      }
    } else if (isSA) {
      // SA deletes their own DRAFT/UNPUBLISHED or ADMIN's UNPUBLISHED
      const canDelete = isOwner 
        ? ['DRAFT', 'UNPUBLISHED'].includes(article.status)
        : article.status === 'UNPUBLISHED';

      if (!canDelete) {
        res.status(403).json({ message: 'You can only delete your own draft/unpublished articles or unpublished guest articles' });
        return;
      }
    } else {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    // Soft Delete
    article.isDeleted = true;
    article.deletedAt = new Date();
    article.deletedBy = new (mongoose.Types.ObjectId as any)(user.id);
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
      deletedBy: user?.id
    };

    if (search) {
      query.title = new RegExp(search as string, 'i');
    }

    const total = await Article.countDocuments(query);
    const articles = await Article.find(query)
      .populate('poster', 'name email')
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

    const article = await Article.findOne({ _id: id, isDeleted: true, deletedBy: user?.id });

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

    const article = await Article.findOne({ _id: id, isDeleted: true, deletedBy: user?.id });

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

