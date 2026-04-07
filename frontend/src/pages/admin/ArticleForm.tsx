import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Save, Send, CheckCircle, Image as ImageIcon, Loader2, AlertCircle, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../../components/ui/Button/Button";
import TiptapEditor from "../../components/editor/TiptapEditor";
import { articleService, type ArticleData } from "../../services/articleService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { getRolePrefix } from "../../constants/navigation";
import { cn } from "../../utils/cn";

const articleSchema = z.object({
  title: z.string().min(10, 'Tiêu đề phải có ít nhất 10 ký tự').max(200, 'Tiêu đề quá dài'),
  description: z.string().optional(),
  content: z.string().optional(),
  thumbnail: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'UNPUBLISHED']),
}).superRefine((data, ctx) => {
  if (data.status !== 'DRAFT') {
    if (!data.description || data.description.length < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mô tả phải có ít nhất 20 ký tự',
        path: ['description'],
      });
    }
    if (!data.content || data.content.length < 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nội dung phải có ít nhất 100 ký tự',
        path: ['content'],
      });
    }
    if (!data.thumbnail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng tải lên ảnh đại diện',
        path: ['thumbnail'],
      });
    }
  }
});

type ArticleFormValues = z.infer<typeof articleSchema>;

const ArticleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!id;
  const rolePrefix = getRolePrefix(user?.role || 'ADMIN');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      thumbnail: "",
      status: "DRAFT"
    }
  });

  const currentStatus = watch('status');
  const currentThumbnail = watch('thumbnail');
  const currentContent = watch('content');

  const [isUploading, setIsUploading] = useState(false);

  // Fetch article if editing
  const { data: existingArticle, isLoading: isFetching } = useQuery({
    queryKey: ['article', id],
    queryFn: () => articleService.getArticleById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingArticle) {
      console.log(existingArticle)
      reset({
        title: existingArticle.title,
        description: existingArticle.description,
        content: existingArticle.content,
        thumbnail: existingArticle.thumbnail,
        status: existingArticle.status
      });
    }
  }, [existingArticle, reset]);

  const mutation = useMutation({
    mutationFn: (data: ArticleFormValues) => 
      isEdit ? articleService.updateArticle(id!, data as any) : articleService.createArticle(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      navigate(`${rolePrefix}/article`);
    }
  });

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        const { url } = await articleService.uploadImage(file);
        setValue('thumbnail', url, { shouldValidate: true });
      } catch (error) {
        console.error('Thumbnail upload failed:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const onSubmit = (data: ArticleFormValues) => {
    mutation.mutate(data);
  };

  const handleAction = (status: ArticleData['status']) => {
    setValue('status', status);
    handleSubmit(onSubmit)();
  };

  if (isEdit && isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="ContentMRegular text-gray-400">Loading article data...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
          </button>
          <div>
            <h2 className="DisplayLBold text-gray-900">{isEdit ? 'Edit Article' : 'Create New Article'}</h2>
            <p className="ContentSRegular text-gray-400">Share your thoughts and insights with the world.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="md" 
            leftIcon={<Save className="w-5 h-5" />}
            onClick={() => handleAction('DRAFT')}
            isLoading={mutation.isPending && currentStatus === 'DRAFT'}
            disabled={mutation.isPending}
          >
            Save Draft
          </Button>
          
          {user?.role === 'SUPER_ADMIN' ? (
            <div className="flex items-center gap-2">
              {isEdit && existingArticle?.status === 'PUBLISHED' && (
                <Button 
                  variant="outline" 
                  size="md" 
                  leftIcon={<XCircle className="w-5 h-5 text-amber-500" />}
                  onClick={() => handleAction('UNPUBLISHED')}
                  isLoading={mutation.isPending && currentStatus === 'UNPUBLISHED'}
                  disabled={mutation.isPending}
                >
                  Unpublish
                </Button>
              )}
              <Button 
                variant="primary" 
                size="md" 
                leftIcon={<CheckCircle className="w-5 h-5" />}
                onClick={() => handleAction('PUBLISHED')}
                isLoading={mutation.isPending && currentStatus === 'PUBLISHED'}
                disabled={mutation.isPending}
              >
                {existingArticle?.status === 'PUBLISHED' ? 'Update & Publish' : 'Publish Now'}
              </Button>
            </div>
          ) : (
            <Button 
              variant="primary" 
              size="md" 
              leftIcon={<Send className="w-5 h-5" />}
              onClick={() => handleAction('PENDING')}
              isLoading={mutation.isPending && currentStatus === 'PENDING'}
              disabled={mutation.isPending}
            >
              Submit for Review
            </Button>
          )}
        </div>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Fields */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <label className="ContentSBold text-gray-700">Article Title</label>
              <input
                type="text"
                placeholder="Enter a catchy title..."
                className={cn(
                  "w-full bg-white border rounded-2xl p-4 DisplaySBold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm",
                  errors.title ? "border-error focus:ring-error/20 focus:border-error" : "border-gray-100"
                )}
                {...register('title')}
              />
              {errors.title && (
                <p className="ContentSRegular text-error flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="ContentSBold text-gray-700">Short Description</label>
              <textarea
                placeholder="Write a brief overview of this article..."
                className={cn(
                  "w-full bg-white border rounded-2xl p-4 ContentMRegular text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm h-24 resize-none",
                  errors.description ? "border-error focus:ring-error/20 focus:border-error" : "border-gray-100"
                )}
                {...register('description')}
              />
              {errors.description && (
                <p className="ContentSRegular text-error flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="ContentSBold text-gray-700">Content</label>
              <div className={cn(
                "rounded-2xl border",
                errors.content ? "border-error" : "border-transparent"
              )}>
                <TiptapEditor 
                  content={currentContent || ""} 
                  onChange={(content) => setValue('content', content, { shouldValidate: true })} 
                />
              </div>
              {errors.content && (
                <p className="ContentSRegular text-error flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.content.message}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6">
            {/* Thumbnail Upload */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <label className="ContentSBold text-gray-700">Featured Image</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative aspect-[16/10] rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2 group",
                  currentThumbnail ? "border-primary/50" : "border-gray-200 hover:border-primary/40 bg-gray-50/50",
                  errors.thumbnail && "border-error/50 bg-error/5"
                )}
              >
                {currentThumbnail ? (
                  <>
                    <img src={currentThumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    ) : (
                      <div className={cn(
                        "p-3 rounded-full bg-white shadow-sm transition-colors",
                        errors.thumbnail ? "text-error" : "text-gray-400 group-hover:text-primary"
                      )}>
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    <span className={cn(
                      "ContentSMedium transition-colors",
                      errors.thumbnail ? "text-error/70" : "text-gray-400 group-hover:text-primary/70"
                    )}>
                      {isUploading ? 'Uploading...' : 'Click to upload thumbnail'}
                    </span>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleThumbnailUpload}
              />
              {errors.thumbnail && (
                <p className="ContentSRegular text-error flex items-center justify-center gap-1 text-center">
                  <AlertCircle className="w-3 h-3" /> {errors.thumbnail.message}
                </p>
              )}
              <p className="text-[10px] text-gray-400 text-center">
                Recommended size: 1200x750px. JPEG, PNG, WEBP.
              </p>
            </div>

            {/* Publishing Settings */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
               <label className="ContentSBold text-gray-700">Publishing Details</label>
               <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="ContentSRegular text-gray-500">Status</span>
                    <span className="ContentSBold text-primary">{currentStatus}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="ContentSRegular text-gray-500">Visibility</span>
                    <span className="ContentSBold text-gray-700">Public</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="ContentSRegular text-gray-500">Schedule</span>
                    <span className="ContentSBold text-gray-700">Now</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ArticleForm;
