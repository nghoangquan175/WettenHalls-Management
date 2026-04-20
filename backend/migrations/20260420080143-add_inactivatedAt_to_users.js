module.exports = {
  async up(db, _client) {
    // Add inactivatedAt field to all users, default to null
    await db
      .collection('users')
      .updateMany(
        { inactivatedAt: { $exists: false } },
        { $set: { inactivatedAt: null } }
      );
  },

  async down(db, _client) {
    // Remove inactivatedAt field from all users
    await db
      .collection('users')
      .updateMany({}, { $unset: { inactivatedAt: '' } });
  },
};
