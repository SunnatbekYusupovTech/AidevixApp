import axiosInstance from './axiosInstance';

export const videoApi = {
  // Kurs uchun barcha videolar
  getCourseVideos: (courseId: string) =>
    axiosInstance.get(`/videos/course/${courseId}`),

  // Bitta video (signed embed URL bilan)
  getVideo: (videoId: string) =>
    axiosInstance.get(`/videos/${videoId}`),

  // Video qidirish
  searchVideos: (params?: { q?: string; courseId?: string; page?: number; limit?: number }) =>
    axiosInstance.get('/videos/search', { params }),

  // Top videolar
  getTopVideos: (limit?: number) =>
    axiosInstance.get('/videos/top', { params: { limit } }),
};
