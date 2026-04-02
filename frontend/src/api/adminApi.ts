import axiosClient from './axiosClient';

export const adminApi = {
  // Users
  getUsers: () => axiosClient.get('/v1/users'),
  getUserById: (id: number) => axiosClient.get(`/v1/users/${id}`),
  updateUser: (id: number, data: any) => axiosClient.put(`/v1/users/${id}`, data),
  deleteUser: (id: number) => axiosClient.delete(`/v1/users/${id}`),

  // Subjects
  getSubjects: () => axiosClient.get('/v1/subjects'),
  createSubject: (data: { name: string }) => axiosClient.post('/v1/subjects', data),
  updateSubject: (id: number, data: { name: string }) => axiosClient.put(`/v1/subjects/${id}`, data),
  deleteSubject: (id: number) => axiosClient.delete(`/v1/subjects/${id}`),

  // Questions
  getQuestions: (subjectId?: number, keyword?: string, page = 0, size = 100) => {
    let url = `/v1/questions?page=${page}&size=${size}`;
    if (subjectId) url += `&subjectId=${subjectId}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    return axiosClient.get(url);
  },
  createQuestion: (data: any) => axiosClient.post('/v1/questions', data),
  updateQuestion: (id: number, data: any) => axiosClient.put(`/v1/questions/${id}`, data),
  deleteQuestion: (id: number) => axiosClient.delete(`/v1/questions/${id}`),

  // Exams
  getExams: () => axiosClient.get('/v1/exams'),
  createExam: (data: any) => axiosClient.post('/v1/exams', data),
  updateExam: (id: number, data: any) => axiosClient.put(`/v1/exams/${id}`, data),
  deleteExam: (id: number) => axiosClient.delete(`/v1/exams/${id}`),

  // Participants
  getExamParticipants: (examId: number) => axiosClient.get(`/v1/exams/${examId}/participants`),
  addExamParticipant: (examId: number, data: { userId: number }) => axiosClient.post(`/v1/exams/${examId}/participants`, data),

  // Reports
  getExamResults: (examId: number) => axiosClient.get(`/v1/api/results/exam/${examId}`),
};
