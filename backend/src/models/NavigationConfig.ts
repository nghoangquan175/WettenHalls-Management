import mongoose, { Schema, Document } from 'mongoose';

export interface INavItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  targetBlank?: boolean;
  children?: INavItem[];
}

export interface INavigationConfig extends Document {
  type: 'header' | 'footer';
  versionName: string;
  active: boolean;
  items: INavItem[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Recursive NavItem Schema
const NavItemSchema = new Schema();
NavItemSchema.add({
  id: { type: String, required: true },
  label: { type: String, required: true },
  url: { type: String }, // Optional URL
  icon: { type: String },
  targetBlank: { type: Boolean, default: false },
  children: [NavItemSchema], // Self-referencing for recursive menus
});

const NavigationConfigSchema = new Schema<INavigationConfig>(
  {
    type: {
      type: String,
      enum: ['header', 'footer'],
      required: true,
    },
    versionName: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
    items: {
      type: [NavItemSchema],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function (_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: function (_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

// Compound unique index: no two versions of the same type can share a name
NavigationConfigSchema.index({ type: 1, versionName: 1 }, { unique: true });

export default mongoose.model<INavigationConfig>(
  'NavigationConfig',
  NavigationConfigSchema
);
