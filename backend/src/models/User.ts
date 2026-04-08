import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'GUEST'] as const;
export type UserRole = typeof USER_ROLES[number];

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  permissions: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  createdAt: Date;
  matchPassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: USER_ROLES, default: 'GUEST' },
  permissions: { type: [String], enum: ['CREATE', 'VIEW', 'PUBLISH_TOGGLE', 'EDIT', 'DELETE'], default: ['VIEW'] },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'PENDING'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
      ret.id = ret._id;
      delete ret._id;
    }
  },
  toObject: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
      ret.id = ret._id;
      delete ret._id;
    }
  }
});

// Method to compare entered password with hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password before saving
UserSchema.pre<IUser>('save', async function() {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password!, salt);
});

export default mongoose.model<IUser>('User', UserSchema);
