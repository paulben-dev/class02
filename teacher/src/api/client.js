import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (username, password) => api.post('/auth/login', { username, password });
export const register = (data) => api.post('/auth/register', data);

// Homework
export const getHomeworkList = (params) => api.get('/homework', { params });
export const getHomeworkDetail = (id) => api.get(`/homework/${id}`);
export const createHomework = (data) => api.post('/homework', data);
export const deleteHomework = (id) => api.delete(`/homework/${id}`);
export const getHomeworkStats = (id) => api.get(`/homework/${id}/stats`);

// Questions
export const getQuestions = (params) => api.get('/questions', { params });
export const createQuestion = (data) => api.post('/questions', data);

// Classes
export const getClasses = (params) => api.get('/classes', { params });
export const getClassStudents = (id) => api.get(`/classes/${id}/students`);

// Teacher settings
export const getTeacherClasses = () => api.get('/teacher/classes');
export const updateTeacherClasses = (classIds) => api.put('/teacher/classes', { class_ids: classIds });

// Submissions
export const getSubmissions = (homework_id) => api.get('/submissions', { params: { homework_id } });
export const getSubmissionDetail = (id) => api.get(`/submissions/${id}`);
export const gradeSubmission = (id, data) => api.post(`/submissions/${id}/grade`, data);

export default api;
