import { Request, Response } from 'express';
import NavigationConfig from '../models/NavigationConfig';
import mongoose from 'mongoose';

export const listVersions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { type } = req.query;
    if (!type || !['header', 'footer'].includes(type as string)) {
      res
        .status(400)
        .json({ message: 'Valid type (header or footer) is required' });
      return;
    }

    const versions = await NavigationConfig.find({ type })
      .select('versionName active updatedAt createdAt')
      .sort({ updatedAt: -1 });

    res.status(200).json(versions);
  } catch (_error) {
    console.error('[listVersions] Error:', _error);
    res.status(500).json({ message: 'Error listing versions' });
  }
};

export const getActiveVersion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { type } = req.query;
    if (!type || !['header', 'footer'].includes(type as string)) {
      res
        .status(400)
        .json({ message: 'Valid type (header or footer) is required' });
      return;
    }

    const version = await NavigationConfig.findOne({ type, active: true });
    if (!version) {
      res.status(404).json({ message: 'No active version found' });
      return;
    }

    res.status(200).json(version);
  } catch (_error) {
    console.error('[getActiveVersion] Error:', _error);
    res.status(500).json({ message: 'Error fetching active version' });
  }
};

export const getPublicNavigation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const configs = await NavigationConfig.find({ active: true });
    const result = {
      header: configs.find((c) => c.type === 'header') || null,
      footer: configs.find((c) => c.type === 'footer') || null,
    };
    res.status(200).json(result);
  } catch (_error) {
    console.error('[getPublicNavigation] Error:', _error);
    res.status(500).json({ message: 'Error fetching public navigation' });
  }
};

export const getVersionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const version = await NavigationConfig.findById(id);
    if (!version) {
      res.status(404).json({ message: 'Version not found' });
      return;
    }
    res.status(200).json(version);
  } catch (_error) {
    console.error('[getVersionById] Error:', _error);
    res.status(500).json({ message: 'Error fetching version detail' });
  }
};

export const createVersion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { type, versionName, items } = req.body;
    const userId = req.session.user?.id;

    if (!type || !versionName) {
      res.status(400).json({ message: 'Type and Version Name are required' });
      return;
    }

    if (!userId) {
      res
        .status(401)
        .json({ message: 'User session expired. Please log in again.' });
      return;
    }

    // Check if version name exists for this type
    const existing = await NavigationConfig.findOne({ type, versionName });
    if (existing) {
      res
        .status(400)
        .json({
          message: `Version name "${versionName}" already exists for ${type}`,
        });
      return;
    }

    const version = await NavigationConfig.create({
      type,
      versionName,
      items: items || [],
      active: false,
      createdBy: new mongoose.Types.ObjectId(userId),
      updatedBy: new mongoose.Types.ObjectId(userId),
    });

    res.status(201).json(version);
  } catch (_error) {
    console.error('[createVersion] Global Error:', _error);
    res
      .status(500)
      .json({
        message: 'Error creating version',
        detail: _error instanceof Error ? _error.message : String(_error),
      });
  }
};

export const updateVersion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    const userId = req.session.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User session expired' });
      return;
    }

    const version = await NavigationConfig.findById(id);
    if (!version) {
      res.status(404).json({ message: 'Version not found' });
      return;
    }

    version.items = items;
    version.updatedBy = new mongoose.Types.ObjectId(userId);
    version.updatedAt = new Date();

    await version.save();
    res.status(200).json(version);
  } catch (_error) {
    console.error('[updateVersion] Error:', _error);
    res.status(500).json({ message: 'Error updating version' });
  }
};

export const activateVersion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const version = await NavigationConfig.findById(id);
    if (!version) {
      res.status(404).json({ message: 'Version not found' });
      return;
    }

    // Step 1: Deactivate all versions of the same type
    // This is done sequentially. While not a transaction, it works on standalone MongoDB.
    await NavigationConfig.updateMany(
      { type: version.type, _id: { $ne: version._id } },
      { $set: { active: false } }
    );

    // Step 2: Activate target version
    version.active = true;
    version.updatedAt = new Date();
    await version.save();

    res.status(200).json(version);
  } catch (_error) {
    console.error('[activateVersion] Error:', _error);
    res.status(500).json({ message: 'Error activating version' });
  }
};

export const deleteVersion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const version = await NavigationConfig.findById(id);
    if (!version) {
      res.status(404).json({ message: 'Version not found' });
      return;
    }

    if (version.active) {
      res.status(400).json({ message: 'Cannot delete the active version' });
      return;
    }

    await NavigationConfig.findByIdAndDelete(id);
    res.status(200).json({ message: 'Version deleted successfully' });
  } catch (_error) {
    console.error('[deleteVersion] Error:', _error);
    res.status(500).json({ message: 'Error deleting version' });
  }
};
