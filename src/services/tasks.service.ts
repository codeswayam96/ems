import apiClient from '@/lib/api-client';

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Todo' | 'In Progress' | 'Completed';
  dueDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assignee: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  dueDate: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  assignee?: string;
  priority?: 'Critical' | 'High' | 'Medium' | 'Low';
  status?: 'Todo' | 'In Progress' | 'Completed';
  dueDate?: string;
}

export const tasksService = {
  // Get all tasks
  getAll: async () => {
    const response = await apiClient.get('/tasks');
    return response.data;
  },

  // Get task by ID
  getById: async (id: string) => {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  },

  // Create new task
  create: async (payload: CreateTaskPayload) => {
    const response = await apiClient.post('/tasks', payload);
    return response.data;
  },

  // Update task
  update: async (id: string, payload: UpdateTaskPayload) => {
    const response = await apiClient.patch(`/tasks/${id}`, payload);
    return response.data;
  },

  // Delete task
  delete: async (id: string) => {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  },

  // Get tasks by status
  getByStatus: async (status: 'Todo' | 'In Progress' | 'Completed') => {
    const response = await apiClient.get(`/tasks?status=${status}`);
    return response.data;
  },

  // Get user tasks
  getUserTasks: async (userId: string) => {
    const response = await apiClient.get(`/tasks?assignee=${userId}`);
    return response.data;
  },
};
