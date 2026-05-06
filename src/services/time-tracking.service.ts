import apiClient from '@/lib/api-client';

export interface TimeEntry {
  id: string;
  user: string;
  project: string;
  hours: number;
  date: string;
  description?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTimeEntryPayload {
  project: string;
  hours: number;
  date: string;
  description?: string;
}

export interface UpdateTimeEntryPayload {
  project?: string;
  hours?: number;
  date?: string;
  description?: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
}

export const timeTrackingService = {
  // Get all time entries
  getAll: async () => {
    const response = await apiClient.get('/tracking');
    return response.data;
  },

  // Get time entry by ID
  getById: async (id: string) => {
    const response = await apiClient.get(`/tracking/${id}`);
    return response.data;
  },

  // Log new time entry
  create: async (payload: CreateTimeEntryPayload) => {
    const response = await apiClient.post('/tracking', payload);
    return response.data;
  },

  // Update time entry
  update: async (id: string, payload: UpdateTimeEntryPayload) => {
    const response = await apiClient.patch(`/tracking/${id}`, payload);
    return response.data;
  },

  // Delete time entry
  delete: async (id: string) => {
    const response = await apiClient.delete(`/tracking/${id}`);
    return response.data;
  },

  // Get user's time entries
  getUserTimeEntries: async (userId: string) => {
    const response = await apiClient.get(`/tracking?user=${userId}`);
    return response.data;
  },

  // Get time entries by date range
  getByDateRange: async (startDate: string, endDate: string) => {
    const response = await apiClient.get(`/tracking?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Approve time entry
  approve: async (id: string) => {
    const response = await apiClient.patch(`/tracking/${id}`, { status: 'Approved' });
    return response.data;
  },

  // Reject time entry
  reject: async (id: string) => {
    const response = await apiClient.patch(`/tracking/${id}`, { status: 'Rejected' });
    return response.data;
  },
};
