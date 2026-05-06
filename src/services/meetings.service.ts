import apiClient from '@/lib/api-client';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: string;
  organizer: string;
  attendees: string[];
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMeetingPayload {
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: string;
  attendees: string[];
  location?: string;
}

export interface UpdateMeetingPayload {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  duration?: string;
  attendees?: string[];
  location?: string;
}

export const meetingsService = {
  // Get all meetings
  getAll: async () => {
    const response = await apiClient.get('/meetings');
    return response.data;
  },

  // Get meeting by ID
  getById: async (id: string) => {
    const response = await apiClient.get(`/meetings/${id}`);
    return response.data;
  },

  // Create new meeting
  create: async (payload: CreateMeetingPayload) => {
    const response = await apiClient.post('/meetings', payload);
    return response.data;
  },

  // Update meeting
  update: async (id: string, payload: UpdateMeetingPayload) => {
    const response = await apiClient.patch(`/meetings/${id}`, payload);
    return response.data;
  },

  // Delete meeting
  delete: async (id: string) => {
    const response = await apiClient.delete(`/meetings/${id}`);
    return response.data;
  },

  // Get meetings for a date range
  getByDateRange: async (startDate: string, endDate: string) => {
    const response = await apiClient.get(`/meetings?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Get user meetings
  getUserMeetings: async (userId: string) => {
    const response = await apiClient.get(`/meetings?attendee=${userId}`);
    return response.data;
  },
};
