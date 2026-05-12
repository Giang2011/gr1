import axiosClient from './axiosClient';

export interface UserResponseDTO {
  id: number;
  username: string;
  studentId: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

export interface SubjectResponseDTO {
  id: number;
  name: string;
}

export interface ChapterResponseDTO {
  id: number;
  name: string;
  chapterOrder: number;
}

export const adminApi = {
  // Users
  getUsers: () => axiosClient.get('/v1/users'),
  getUserById: (id: number) => axiosClient.get(`/v1/users/${id}`),
  createStudent: (data: { studentId: string, name: string }) => axiosClient.post('/v1/users/students', data),
  createTeacher: (data: { username: string, password: string, name: string }) => axiosClient.post('/v1/users/teachers', data),
  updateMe: (data: { username?: string, password?: string, name?: string }) => axiosClient.put('/v1/users/me', data),
  updateUser: (id: number, data: any) => axiosClient.put(`/v1/users/${id}`, data),
  deleteUser: (id: number) => axiosClient.delete(`/v1/users/${id}`),

  // Subjects & Chapters
  getSubjects: () => axiosClient.get('/v1/subjects'),
  createSubject: (data: any) => axiosClient.post('/v1/subjects', data),
  updateSubject: (id: number, data: any) => axiosClient.put(`/v1/subjects/${id}`, data),
  deleteSubject: (id: number) => axiosClient.delete(`/v1/subjects/${id}`),
  
  getChapters: (subjectId: number) => axiosClient.get(`/v1/subjects/${subjectId}/chapters`),
  createChapter: (subjectId: number, data: { name: string, chapterOrder: number }) => axiosClient.post(`/v1/subjects/${subjectId}/chapters`, data),
  updateChapter: (chapterId: number, data: { name: string, chapterOrder: number }) => axiosClient.put(`/v1/chapters/${chapterId}`, data),
  deleteChapter: (chapterId: number) => axiosClient.delete(`/v1/chapters/${chapterId}`),

  // Questions
  getQuestions: (subjectId?: number, keyword?: string, page = 0, size = 100) => {
    let url = `/v1/questions?page=${page}&size=${size}`;
    if (subjectId) url += `&subjectId=${subjectId}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    return axiosClient.get(url);
  },
  createQuestion: (data: FormData) => axiosClient.post('/v1/questions', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateQuestion: (id: number, data: FormData) => axiosClient.put(`/v1/questions/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
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
  getExamResults: (examId: number) => axiosClient.get(`/v1/results/exam/${examId}`),
};
