import axiosClient from './axiosClient';

// Models matching backend DTOs
export interface ExamResponseDTO {
  id: number;
  title: string;
  subjectId: number;
  subjectName: string;
  duration: number;
  totalQuestions: number;
  startTime: string;
  endTime: string;
  status: string;
  participantCount: number;
}

export interface ExamSessionResponseDTO {
  id: number;
  examId: number;
  examTitle: string;
  userId: number;
  userName: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface ShuffledAnswerDTO {
  examAnswerId: number;
  orderIndex: number;
  content: string;
  imageUrl?: string;
}

export interface ExamQuestionResponseDTO {
  examQuestionId: number;
  orderIndex: number;
  content: string;
  imageUrl?: string;
  isMultipleChoice?: boolean;
  answers: ShuffledAnswerDTO[];
}

export interface SubmitSessionRequestDTO {
  answers: {
    examQuestionId: number;
    selectedExamAnswerIds: number[];
  }[];
}

export interface ResultResponseDTO {
  id: number;
  rank: number;
  examSessionId: number;
  examTitle: string;
  studentName: string;
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  submittedAt: string;
}

export const studentApi = {
  // Exams
  getExams: (): Promise<ExamResponseDTO[]> => {
    return axiosClient.get('/v1/exams');
  },
  getExamById: (id: number): Promise<ExamResponseDTO> => {
    return axiosClient.get(`/v1/exams/${id}`);
  },

  // Sessions
  startSession: (examId: number): Promise<ExamSessionResponseDTO> => {
    return axiosClient.post(`/v1/sessions/start/${examId}`);
  },
  getSessionById: (sessionId: number): Promise<ExamSessionResponseDTO> => {
    return axiosClient.get(`/v1/sessions/${sessionId}`);
  },
  getSessionQuestions: (sessionId: number): Promise<ExamQuestionResponseDTO[]> => {
    return axiosClient.get(`/v1/sessions/${sessionId}/questions`);
  },
  submitSession: (sessionId: number, data: SubmitSessionRequestDTO): Promise<ExamSessionResponseDTO> => {
    return axiosClient.post(`/v1/sessions/${sessionId}/submit`, data);
  },

  // Results
  getMyResults: (): Promise<ResultResponseDTO[]> => {
    return axiosClient.get('/v1/results/me');
  },
  getResultBySession: (sessionId: number): Promise<ResultResponseDTO> => {
    return axiosClient.get(`/v1/results/session/${sessionId}`);
  }
};
