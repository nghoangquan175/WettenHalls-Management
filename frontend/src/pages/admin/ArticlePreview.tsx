import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { articleService } from "../../services/articleService";
import { ArrowLeft, Clock, User2 } from "lucide-react";
import { cn } from "../../utils/cn";

const ArticlePreview = () => {
  const { id } = useParams<{ id: string }>();

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ['article', id],
    queryFn: () => articleService.getArticleById(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h2 className="DisplayS text-gray-900 mb-2">Article Not Found</h2>
        <p className="ContentMRegular text-gray-500 mb-6">The article you are trying to preview might have been deleted.</p>
        <button 
          onClick={() => window.close()}
          className="bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-medium"
        >
          Close Tab
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mini Header */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => window.close()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors ContentSMedium"
          >
            <ArrowLeft className="w-4 h-4" />
            Close Preview
          </button>
          
          <div className={cn(
            "inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest",
            article.status === "PUBLISHED" ? "bg-green-500/10 text-green-500" : 
            article.status === "PENDING" ? "bg-amber-500/10 text-amber-500" : 
            article.status === "UNPUBLISHED" ? "bg-red-500/10 text-red-500" : "bg-gray-500/10 text-gray-500"
          )}>
            {article.status}
          </div>
        </div>
      </div>

      {/* Article Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-6 mb-12">
          <h1 className="DisplayLBold text-gray-900 leading-tight">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-gray-500 ContentSMedium">
            <div className="flex items-center gap-2">
              <User2 className="w-4 h-4" />
              <span>{article.poster.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{new Date(article.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="w-full aspect-video rounded-3xl overflow-hidden bg-gray-100 mb-12 border border-gray-100">
          <img 
            src={article.thumbnail} 
            alt={article.title} 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="prose prose-lg prose-gray max-w-none">
          {/* We use prose for nice styling of HTML content, or just raw HTML */}
          <div dangerouslySetInnerHTML={{ __html: article.content }} className="min-h-[50vh] focus:outline-none" />
        </div>
      </main>
    </div>
  );
};

export default ArticlePreview;
