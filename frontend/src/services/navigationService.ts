import { apiRequest } from "./api";
import { type NavItem } from "../components/admin/settings/NavigationBuilder";

export interface NavigationVersion {
  id: string;
  versionName: string;
  active: boolean;
  type: 'header' | 'footer';
  items: NavItem[];
  updatedAt: string;
  createdAt: string;
}

export type NavigationHeader = Pick<NavigationVersion, 'id' | 'versionName' | 'active' | 'updatedAt' | 'createdAt'>;

export const navigationService = {
  listVersions: async (type: 'header' | 'footer'): Promise<NavigationHeader[]> => {
    return apiRequest<NavigationHeader[]>(`/navigation?type=${type}`);
  },

  getActiveVersion: async (type: 'header' | 'footer'): Promise<NavigationVersion> => {
    return apiRequest<NavigationVersion>(`/navigation/active?type=${type}`);
  },

  getVersionById: async (id: string): Promise<NavigationVersion> => {
    return apiRequest<NavigationVersion>(`/navigation/${id}`);
  },

  createVersion: async (data: { type: 'header' | 'footer'; versionName: string; items: NavItem[] }): Promise<NavigationVersion> => {
    return apiRequest<NavigationVersion>("/navigation", {
      method: "POST",
      body: data
    });
  },

  updateVersion: async (id: string, items: NavItem[]): Promise<NavigationVersion> => {
    return apiRequest<NavigationVersion>(`/navigation/${id}`, {
      method: "PUT",
      body: { items }
    });
  },

  activateVersion: async (id: string): Promise<NavigationVersion> => {
    return apiRequest<NavigationVersion>(`/navigation/${id}/activate`, {
      method: "PATCH"
    });
  },

  deleteVersion: async (id: string): Promise<void> => {
    return apiRequest<void>(`/navigation/${id}`, {
      method: "DELETE"
    });
  }
};
