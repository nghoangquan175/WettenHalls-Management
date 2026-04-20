import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           description: Full name of the user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the user
 *         role:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, GUEST]
 *           default: GUEST
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, PENDING]
 *           default: ACTIVE
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         inactivatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 */

export const USER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'GUEST'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  permissions: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  createdAt: Date;
  inactivatedAt?: Date | null;
  matchPassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, default: 'GUEST' },
    permissions: {
      type: [String],
      enum: ['CREATE', 'VIEW', 'PUBLISH_TOGGLE', 'EDIT', 'DELETE'],
      default: ['VIEW'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
      default: 'ACTIVE',
    },
    createdAt: { type: Date, default: Date.now },
    inactivatedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function (_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
      },
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: function (_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
      },
    },
  }
);

// Method to compare entered password with hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password before saving
UserSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password!, salt);
});

export default mongoose.model<IUser>('User', UserSchema);
