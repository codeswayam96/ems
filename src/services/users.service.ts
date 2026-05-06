import apiClient from '@/lib/api-client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  department?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  status?: 'Active' | 'Inactive';
}

export const usersService = {
  // Get all users
  getAll: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  // Get user by ID
  getById: async (id: string) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  create: async (payload: CreateUserPayload) => {
    const response = await apiClient.post('/users', payload);
    return response.data;
  },

  // Update user
  update: async (id: string, payload: UpdateUserPayload) => {
    const response = await apiClient.patch(`/users/${id}`, payload);
    return response.data;
  },

  // Delete user
  delete: async (id: string) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  // Get users by role
  getByRole: async (role: string) => {
    const response = await apiClient.get(`/users?role=${role}`);
    return response.data;
  },
};
