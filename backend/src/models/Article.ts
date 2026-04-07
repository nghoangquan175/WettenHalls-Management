import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

export interface IArticle extends Document {
  thumbnail: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  poster: mongoose.Types.ObjectId;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'UNPUBLISHED';
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>({
  thumbnail: { type: String, required: true },
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  poster: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['DRAFT', 'PENDING', 'PUBLISHED', 'UNPUBLISHED'], 
    default: 'DRAFT' 
  },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
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

// Pre-validate middleware to generate unique slug
// Using any for this to bypass complex Mongoose 9 type issues in middleware
ArticleSchema.pre('validate', async function(this: any) {
  if (this.isModified('title')) {
    const baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 0;
    
    // Access the model through the document's constructor
    const ArticleModel = this.constructor as any;
    
    while (true) {
        const existing = await ArticleModel.findOne({ slug, _id: { $ne: this._id } });
        if (!existing) break;
        count++;
        slug = `${baseSlug}-${count}`;
    }
    this.slug = slug;
  }
});

export default mongoose.model<IArticle>('Article', ArticleSchema);
