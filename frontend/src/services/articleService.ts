import { apiRequest } from "./api";

export interface ArticleData {
  id: string;
  thumbnail: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  poster: {
    id: string;
    name: string;
    email: string;
  };
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'UNPUBLISHED';
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: {
    _id?: string;
    id?: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InfiniteArticleData {
  articles: ArticleData[];
  hasNextPage: boolean;
  nextPage: number | null;
}

export interface CreateArticleData {
  title: string;
  description: string;
  content: string;
  thumbnail: string;
  status?: ArticleData['status'];
}

export const articleService = {
  getArticles: async (search?: string, status?: string, sort?: 'asc' | 'desc', page: number = 1, limit: number = 10): Promise<InfiniteArticleData> => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (sort) params.append("sort", sort);
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    
    return apiRequest<InfiniteArticleData>(`/articles?${params.toString()}`);
  },

  getArticleById: async (id: string): Promise<ArticleData> => {
    return apiRequest<ArticleData>(`/articles/${id}`);
  },

  createArticle: async (data: CreateArticleData): Promise<ArticleData> => {
    return apiRequest<ArticleData>("/articles", {
      method: "POST",
      body: data
    });
  },

  updateArticle: async (id: string, data: Partial<CreateArticleData>): Promise<ArticleData> => {
    return apiRequest<ArticleData>(`/articles/${id}`, {
      method: "PUT",
      body: data
    });
  },

  updateArticleStatus: async (id: string, status: ArticleData['status']): Promise<ArticleData> => {
    return apiRequest<ArticleData>(`/articles/${id}/status`, {
      method: "PATCH",
      body: { status }
    });
  },

  deleteArticle: async (id: string): Promise<void> => {
    return apiRequest<void>(`/articles/${id}`, {
      method: "DELETE"
    });
  },

  getTrash: async (search?: string, page: number = 1, limit: number = 10): Promise<InfiniteArticleData> => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    
    return apiRequest<InfiniteArticleData>(`/articles/trash?${params.toString()}`);
  },

  restoreArticle: async (id: string): Promise<ArticleData> => {
    return apiRequest<ArticleData>(`/articles/${id}/restore`, {
      method: "PATCH"
    });
  },

  permanentDeleteArticle: async (id: string): Promise<void> => {
    return apiRequest<void>(`/articles/${id}/permanent`, {
      method: "DELETE"
    });
  },


  uploadImage: async (file: File): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append("image", file); 

    return apiRequest<{ url: string; publicId: string }>("/upload/image", {
      method: "POST",
      body: formData,
    });
  }
};
