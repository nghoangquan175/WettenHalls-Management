import { useState } from "react";
import { Plus, Search, Trash2, Edit2, ChevronDown, ChevronUp, CheckCircle, XCircle, Eye, Send, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import DataTable, { type Column } from "../../components/common/DataTable";
import { cn } from "../../utils/cn";
import { ConfirmModal } from "../../components/ui/Modal/ConfirmModal";
import { ActionButton } from "../../components/ui/Button/ActionButton";
import { articleService, type ArticleData } from "../../services/articleService";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { useDebounce } from "../../hooks/useDebounce";
import { useNavigate } from "react-router-dom";
import { getRolePrefix } from "../../constants/navigation";

const Articles = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ArticleData['status'] | 'ALL'>('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null);
  const [actionType, setActionType] = useState<'status' | 'delete' | null>(null);
  const [targetStatus, setTargetStatus] = useState<ArticleData['status'] | null>(null);
  
  const debouncedSearch = useDebounce(searchTerm, 500);
  const queryClient = useQueryClient();

  const rolePrefix = getRolePrefix(user?.role || 'ADMIN');
  
  const { 
    data, 
    isLoading, 
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['articles', { search: debouncedSearch, status: statusFilter, sort: sortOrder }],
    queryFn: ({ pageParam = 1 }) => 
      articleService.getArticles(debouncedSearch, statusFilter === 'ALL' ? undefined : statusFilter, sortOrder, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  const flatArticles = data?.pages.flatMap(page => page.articles) || [];

  const handleCloseModals = () => {
    setSelectedArticle(null);
    setActionType(null);
    setTargetStatus(null);
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: ArticleData['status'] }) => 
      articleService.updateArticleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      handleCloseModals();
    },
    onError: (error: any) => {
      const msg = error.message || '';
      if (msg.includes('thu hồi') || msg.includes('ARTICLE_REVOKED')) {
        alert("Bài viết này đã được Admin thu hồi hoặc đang ở trạng thái Nháp. Hệ thống sẽ cập nhật lại danh sách.");
        queryClient.invalidateQueries({ queryKey: ['articles'] });
      } else {
        alert(msg || "Có lỗi xảy ra khi cập nhật trạng thái.");
      }
      handleCloseModals();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => articleService.deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      handleCloseModals();
    }
  });

  const columns: Column<ArticleData>[] = [
    {
      header: "Article",
      accessor: (article) => (
        <div className="flex items-center gap-4 py-1">
          <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
            <img 
              src={article.thumbnail} 
              alt={article.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Thumbnail';
              }}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="ContentMMedium text-gray-900 truncate leading-tight group-hover:text-primary transition-colors cursor-pointer block">
              {article.title}
            </span>
            <span className="ContentSMedium text-gray-400 mt-0.5 line-clamp-1 max-w-full">{article.description}</span>
          </div>
        </div>
      ),
      className: "w-[30%] min-w-[280px] max-w-[320px]"
    },
    {
        header: (
          <div className="relative group/filter">
            <button 
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                const menu = document.getElementById('status-filter-menu-article');
                if (menu) menu.classList.toggle('hidden');
              }}
            >
              Status
              <ChevronDown className="w-3 h-3" />
            </button>
            <div 
              id="status-filter-menu-article"
              className="hidden absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200"
            >
              {['ALL', 'DRAFT', 'PENDING', 'PUBLISHED', 'UNPUBLISHED'].map((status) => (
                <button
                  key={status}
                  className={cn(
                    "w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors",
                    statusFilter === status ? "text-primary" : "text-gray-500"
                  )}
                  onClick={() => {
                    setStatusFilter(status as any);
                    document.getElementById('status-filter-menu-article')?.classList.add('hidden');
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        ),
        accessor: (article) => (
          <div className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
            article.status === "PUBLISHED" ? "bg-green-500/10 text-green-500" : 
            article.status === "PENDING" ? "bg-amber-500/10 text-amber-500" : 
            article.status === "UNPUBLISHED" ? "bg-red-500/10 text-red-500" : "bg-gray-500/10 text-gray-500"
          )}>
            {article.status}
          </div>
        )
      },
      {
        header: "Poster",
        accessor: (article) => (
          <div className="flex flex-col">
            <span className="ContentSMedium text-gray-700">{article.poster.name}</span>
            <span className="text-[10px] text-gray-400">{article.poster.email}</span>
          </div>
        )
      },
      {
        header: (
          <button 
            className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            Date
            {sortOrder === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        ),
        accessor: (article) => (
            <span className="tabular-nums">{article.createdAt.split('T')[0]}</span>
        )
      },
      {
        header: "Actions",
        accessor: (article) => (
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <ActionButton 
              icon={<Eye className="w-4 h-4" />}
              variant="default"
              tooltip="Preview"
              onClick={() => window.open(`${rolePrefix}/article/${article.id}/preview`, '_blank')}
            />
            
            {/* SUPER ADMIN Status Actions */}
            {user?.role === 'SUPER_ADMIN' && ['PENDING', 'DRAFT', 'UNPUBLISHED'].includes(article.status) && (
              <ActionButton 
                icon={<CheckCircle className="w-4 h-4" />}
                variant="success"
                tooltip="Approve / Publish"
                onClick={() => { setSelectedArticle(article); setActionType('status'); setTargetStatus('PUBLISHED'); }}
              />
            )}
            {user?.role === 'SUPER_ADMIN' && article.status === 'PENDING' && (
              <ActionButton 
                icon={<XCircle className="w-4 h-4" />}
                variant="warning"
                tooltip="Reject to Draft"
                onClick={() => { setSelectedArticle(article); setActionType('status'); setTargetStatus('DRAFT'); }}
              />
            )}
            {user?.role === 'SUPER_ADMIN' && article.status === 'PUBLISHED' && (
              <ActionButton 
                icon={<XCircle className="w-4 h-4" />}
                variant="warning"
                tooltip="Unpublish"
                onClick={() => { setSelectedArticle(article); setActionType('status'); setTargetStatus('UNPUBLISHED'); }}
              />
            )}

            {/* ADMIN PUBLISH_TOGGLE Actions */}
            {user?.role === 'ADMIN' && user?.permissions?.includes('PUBLISH_TOGGLE') && (
              <>
                {article.status === 'PUBLISHED' && (
                  <ActionButton 
                    icon={<XCircle className="w-4 h-4" />}
                    variant="warning"
                    tooltip="Gỡ bài"
                    onClick={() => { setSelectedArticle(article); setActionType('status'); setTargetStatus('UNPUBLISHED'); }}
                  />
                )}
                {article.status === 'UNPUBLISHED' && (
                  <ActionButton 
                    icon={<CheckCircle className="w-4 h-4" />}
                    variant="success"
                    tooltip="Đăng lại"
                    onClick={() => { setSelectedArticle(article); setActionType('status'); setTargetStatus('PUBLISHED'); }}
                  />
                )}
              </>
            )}
            
            {/* ADMIN Status Actions */}
            {user?.role === 'ADMIN' && article.status === 'DRAFT' && article.poster.id === user?.id && (
               <ActionButton 
                 icon={<Send className="w-4 h-4" />}
                 variant="default"
                 tooltip="Send Request"
                 onClick={() => { setSelectedArticle(article); setActionType('status'); setTargetStatus('PENDING'); }}
               />
            )}
            {user?.role === 'ADMIN' && article.status === 'PENDING' && article.poster.id === user?.id && (
               <ActionButton 
                 icon={<RotateCcw className="w-4 h-4" />}
                 variant="warning"
                 tooltip="Revoke Request"
                 onClick={() => { setSelectedArticle(article); setActionType('status'); setTargetStatus('DRAFT'); }}
               />
            )}

            {/* Edit Action */}
            {((user?.role === 'SUPER_ADMIN' && article.status !== 'PUBLISHED') || 
              (user?.role === 'ADMIN' && article.status === 'DRAFT' && article.poster.id === user?.id) ||
              (user?.role === 'ADMIN' && article.status === 'UNPUBLISHED' && user?.permissions?.includes('EDIT'))) && (
                <ActionButton 
                  icon={<Edit2 className="w-4 h-4" />}
                  variant="default"
                  tooltip="Edit"
                  onClick={() => navigate(`${rolePrefix}/article/${article.id}/edit`)}
                />
            )}
            
            {/* Move to Trash Action */}
            {(article.status !== 'PUBLISHED' && (
              (article.status === 'DRAFT' && article.poster.id === user?.id) ||
              (article.status === 'UNPUBLISHED' && (user?.role === 'SUPER_ADMIN' || user?.permissions?.includes('DELETE')))
            )) && (
                <ActionButton 
                  icon={<Trash2 className="w-4 h-4" />}
                  variant="danger"
                  tooltip="Move to Trash"
                  onClick={() => { setSelectedArticle(article); setActionType('delete'); }}
                />
            )}
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
          <h2 className="DisplayLBold text-gray-900">Article Management</h2>
          <p className="ContentMRegular text-gray-400 mt-1">Manage, review, and publish your content.</p>
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.permissions.includes('CREATE')) && (
          <Button 
            variant="primary" 
            size="md" 
            leftIcon={<Plus className="w-5 h-5" />}
            onClick={() => navigate(`${rolePrefix}/article/create`)}
          >
             New Article
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
             <input 
                type="text" 
                placeholder="Search by title..." 
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
        emptyMessage="No articles found."
        wrapperClassName="overflow-visible"
      />
      
      {/* Modals */}
      <ConfirmModal
        isOpen={actionType === 'delete'}
        onClose={handleCloseModals}
        onConfirm={() => selectedArticle && deleteMutation.mutate(selectedArticle.id)}
        title="Move to Trash"
        message={`Are you sure you want to move "${selectedArticle?.title}" to Trash? You can restore it later from the Trash Bin.`}
        confirmText="Move to Trash"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmModal
        isOpen={actionType === 'status' && !!targetStatus}
        onClose={handleCloseModals}
        onConfirm={() => selectedArticle && targetStatus && statusMutation.mutate({ id: selectedArticle.id, status: targetStatus })}
        title={
          targetStatus === 'PUBLISHED' 
            ? (selectedArticle?.status === 'UNPUBLISHED' ? 'Đăng bài trở lại' : 'Publish Article') 
            : (targetStatus === 'UNPUBLISHED' ? 'Tạm gỡ bài viết' : 'Unpublish Article')
        }
        message={
          targetStatus === 'PUBLISHED' 
            ? (selectedArticle?.status === 'UNPUBLISHED' 
                ? `Bạn có chắc chắn muốn đăng lại bài viết "${selectedArticle?.title}" không?` 
                : `Confirm changing status of "${selectedArticle?.title}" to PUBLISHED?`) 
            : (targetStatus === 'UNPUBLISHED' 
                ? `Bạn có chắc chắn muốn tạm gỡ bài viết "${selectedArticle?.title}" khỏi trang công khai?` 
                : `Confirm changing status of "${selectedArticle?.title}" to ${targetStatus}?`)
        }
        confirmText={
          targetStatus === 'PUBLISHED' 
            ? (selectedArticle?.status === 'UNPUBLISHED' ? 'Đăng lại' : 'Publish') 
            : (targetStatus === 'UNPUBLISHED' ? 'Tạm gỡ' : 'Unpublish')
        }
        variant={targetStatus === 'PUBLISHED' ? 'success' : 'warning'}
        isLoading={statusMutation.isPending}
      />
    </div>
  );
};

export default Articles;
