import { useState } from "react";
import { Search, Trash2, RotateCcw } from "lucide-react";
import DataTable, { type Column } from "../../components/common/DataTable";
import { cn } from "../../utils/cn";
import { ConfirmModal } from "../../components/ui/Modal/ConfirmModal";
import { ActionButton } from "../../components/ui/Button/ActionButton";
import { articleService, type ArticleData } from "../../services/articleService";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "../../hooks/useDebounce";

const Trash = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null);
  const [actionType, setActionType] = useState<'restore' | 'permanent' | null>(null);
  
  const debouncedSearch = useDebounce(searchTerm, 500);
  const queryClient = useQueryClient();
  
  const { 
    data, 
    isLoading, 
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['articles-trash', { search: debouncedSearch }],
    queryFn: ({ pageParam = 1 }) => 
      articleService.getTrash(debouncedSearch, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  const flatArticles = data?.pages.flatMap(page => page.articles) || [];

  const handleCloseModals = () => {
    setSelectedArticle(null);
    setActionType(null);
  };

  const restoreMutation = useMutation({
    mutationFn: (id: string) => articleService.restoreArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles-trash'] });
      handleCloseModals();
    }
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: (id: string) => articleService.permanentDeleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles-trash'] });
      handleCloseModals();
    }
  });

  const columns: Column<ArticleData>[] = [
    {
      header: "Article",
      accessor: (article) => (
        <div className="flex items-center gap-4 py-1">
          <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100 italic">
            {article.thumbnail ? (
                <img 
                    src={article.thumbnail} 
                    alt={article.title} 
                    className="w-full h-full object-cover grayscale opacity-60"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Thumbnail';
                    }}
                />
            ) : (
                <div className="w-full h-full bg-gray-50" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="ContentMMedium text-gray-500 truncate leading-tight">
              {article.title}
            </span>
            <span className="ContentSMedium text-gray-400 mt-0.5 line-clamp-1 max-w-full italic">Deleted article</span>
          </div>
        </div>
      ),
      className: "w-[40%] min-w-[280px] max-w-[400px]"
    },
    // {
    //     header: "Status When Deleted",
    //     accessor: (article) => (
    //       <div className={cn(
    //         "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest opacity-60",
    //         article.status === "PUBLISHED" ? "bg-green-500/10 text-green-500" : 
    //         article.status === "PENDING" ? "bg-amber-500/10 text-amber-500" : 
    //         article.status === "UNPUBLISHED" ? "bg-red-500/10 text-red-500" : "bg-gray-500/10 text-gray-500"
    //       )}>
    //         {article.status}
    //       </div>
    //     )
    //   },
      {
        header: "Deleted At",
        accessor: (article) => (
            <span className="tabular-nums text-gray-400">
                {article.deletedAt ? new Date(article.deletedAt).toLocaleDateString() : 'Unknown'}
            </span>
        )
      },
      {
        header: "Actions",
        accessor: (article) => (
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <ActionButton 
                icon={<RotateCcw className="w-4 h-4" />}
                variant="success"
                tooltip="Restore"
                onClick={() => { setSelectedArticle(article); setActionType('restore'); }}
                isLoading={restoreMutation.isPending && selectedArticle?.id === article.id}
            />
            <ActionButton 
                icon={<Trash2 className="w-4 h-4" />}
                variant="danger"
                tooltip="Delete Permanently"
                onClick={() => { setSelectedArticle(article); setActionType('permanent'); }}
                isLoading={permanentDeleteMutation.isPending && selectedArticle?.id === article.id}
            />
          </div>
        ),
        className: "text-right"
      }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="DisplayLBold text-gray-900">Trash Bin</h2>
          <p className="ContentMRegular text-gray-400 mt-1">Review and manage deleted articles. You can restore them or delete permanently.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
             <input 
                type="text" 
                placeholder="Search trash..." 
                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-11 pr-4 ContentMRegular text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
        </div>
      </div>

      {/* Data Table */}
      <DataTable 
        columns={columns} 
        data={flatArticles}
        isLoading={isLoading}
        onLoadMore={fetchNextPage}
        hasMore={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        emptyMessage="Your trash is empty."
        wrapperClassName="overflow-visible"
      />
      
      {/* Modals */}
      <ConfirmModal
        isOpen={actionType === 'restore'}
        onClose={handleCloseModals}
        onConfirm={() => selectedArticle && restoreMutation.mutate(selectedArticle.id)}
        title="Restore Article"
        message={`Are you sure you want to restore "${selectedArticle?.title}"? It will appear back in the article list.`}
        confirmText="Restore"
        variant="success"
        isLoading={restoreMutation.isPending}
      />

      <ConfirmModal
        isOpen={actionType === 'permanent'}
        onClose={handleCloseModals}
        onConfirm={() => selectedArticle && permanentDeleteMutation.mutate(selectedArticle.id)}
        title="Delete Permanently"
        message={`WARNING: This action cannot be undone. Are you sure you want to permanently delete "${selectedArticle?.title}"?`}
        confirmText="Delete Forever"
        variant="danger"
        isLoading={permanentDeleteMutation.isPending}
      />
    </div>
  );
};

export default Trash;
