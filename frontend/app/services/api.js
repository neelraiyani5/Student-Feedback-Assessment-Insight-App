import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Replace with your actual backend IP address if testing on device
// For Android Emulator use 'http://10.0.2.2:3002'
// For iOS Simulator use 'http://localhost:3002'
// For Android Emulator use 'http://10.0.2.2:3002'
// For Physical Device use your machine's IP: 'http://192.168.x.x:3002'
const BASE_URL = "http://10.132.93.75:3001";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const loginUser = async (userId, password) => {
  try {
    const response = await api.post("/auth/login", { userId, password });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getMyProfile = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const changePassword = async (newPassword) => {
  try {
    const response = await api.patch("/auth/change-password", { newPassword });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await api.post("/user/create", userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const promoteToCC = async (facultyId, classId) => {
  try {
    const response = await api.patch("/user/make-CC", { facultyId, classId });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getUsers = async (role) => {
  try {
    const response = await api.get(`/user/list${role ? `?role=${role}` : ""}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await api.patch(`/user/update/${id}`, userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const saveToken = async (token) => {
  if (Platform.OS === "web") {
    localStorage.setItem("userToken", token);
  } else {
    await SecureStore.setItemAsync("userToken", token);
  }
};

export const getToken = async () => {
  if (Platform.OS === "web") {
    return localStorage.getItem("userToken");
  } else {
    return await SecureStore.getItemAsync("userToken");
  }
};

export const clearToken = async () => {
  if (Platform.OS === "web") {
    localStorage.removeItem("userToken");
  } else {
    await SecureStore.deleteItemAsync("userToken");
  }
};

export const getUserInfoFromToken = async () => {
  const token = await getToken();
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload); 
  } catch (e) {
    // Fallback for simple character decoding if atob behaves differently or payload is long
    try {
        const base64Url = token.split('.')[1];
        const jsonPayload = Buffer.from(base64Url, 'base64').toString();
        return JSON.parse(jsonPayload);
    } catch (e2) {
        return null;
    }
  }
};

export const getDashboardSummary = async () => {
  try {
    const response = await api.get("/dashboard/summary");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createDepartment = async (data) => {
  try {
    const response = await api.post("/department/create", data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createSemester = async (data) => {
  try {
    const response = await api.post("/semester/create", data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createClass = async (data) => {
  try {
    const response = await api.post("/class/add", data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateClass = async (id, data) => {
  try {
    const response = await api.patch(`/class/update/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const deleteSemester = async (id) => {
  try {
    const response = await api.delete(`/semester/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const deleteClass = async (id) => {
  try {
    const response = await api.delete(`/class/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getDepartmentOverview = async (id) => {
  try {
    const response = await api.get(`/department/overview/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const assignCC = async (data) => {
  try {
    const response = await api.patch("/class/assign-cc", data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createStudent = async (data) => {
  try {
    const response = await api.post("/class/student/create", data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const bulkUploadStudents = async (formData) => {
  try {
    const response = await api.post("/user/bulk-upload?role=STUDENT", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const bulkUploadFaculty = async (formData) => {
  try {
    const response = await api.post("/user/bulk-upload?role=FACULTY", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const bulkUploadMarks = async (formData) => {
  try {
    const response = await api.post("/marks/bulk-upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getClassStudents = async (classId) => {
  try {
    const response = await api.get(`/class/students/${classId}`);
    return response.data; // { Students: [...] }
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const resetStudentPassword = async (studentId) => {
  try {
    const response = await api.patch("/class/student/reset-password", {
      studentId,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateStudentDetails = async (data) => {
  try {
    const response = await api.patch("/class/student/update", data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const assignStudentPool = async (studentId, poolId) => {
  try {
    const response = await api.patch("/class/pool/add", { studentId, poolId });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createSubject = async (name) => {
  try {
    const response = await api.post("/class/subject/create", { name });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getSubjects = async () => {
  try {
    const response = await api.get("/class/subjects");
    return response.data; // { subjects: [...] }
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const assignFacultyToSubject = async (subjectId, facultyIds) => {
  try {
    const response = await api.patch("/class/subject/assign-faculty", {
      subjectId,
      facultyIds,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getSubjectClasses = async (subjectId) => {
  try {
    const response = await api.get(`/class/subject/${subjectId}/classes`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createAssessment = async (data) => {
  try {
    const response = await api.post("/class/assessment/create", data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getFacultyAssessments = async (subjectId, classId) => {
  try {
    let url = "/class/assessments/list";
    if (subjectId || classId) {
      url += `?${subjectId ? `subjectId=${subjectId}` : ""}${subjectId && classId ? "&" : ""}${classId ? `classId=${classId}` : ""}`;
    }
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getAssessmentMarks = async (id) => {
  try {
    const response = await api.get(`/class/assessment/${id}/details`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateAssessmentMarks = async (assessmentId, marksData) => {
  try {
    const response = await api.patch("/class/assessment/marks/update", {
      assessmentId,
      marksData,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getStudentSubjects = async () => {
  try {
    const response = await api.get("/class/student/subjects");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getStudentSubjectPerformance = async (subjectId) => {
  try {
    const response = await api.get(
      `/class/student/subject/${subjectId}/performance`,
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/class/user/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateSubject = async (id, data) => {
  try {
    const response = await api.patch(`/class/subject/update/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const deleteSubject = async (id) => {
  try {
    const response = await api.delete(`/class/subject/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateAssessment = async (id, data) => {
  try {
    const response = await api.patch(`/class/assessment/update/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const deleteAssessment = async (id) => {
  try {
    const response = await api.delete(`/class/assessment/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Feedback Templates (HOD)
export const createTemplate = async (data) => {
  try {
    const response = await api.post("/feedback-template/create", data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getTemplates = async () => {
  try {
    const response = await api.get("/feedback-template/list");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getTemplateById = async (id) => {
  try {
    const response = await api.get(`/feedback-template/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateTemplate = async (id, data) => {
  try {
    const response = await api.patch(`/feedback-template/update/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const deleteTemplate = async (id) => {
  try {
    const response = await api.delete(`/feedback-template/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Feedback Sessions (Faculty, Student, CC)
export const startFeedbackSession = async (data) => {
  try {
    const response = await api.post("/feedback-session/start", data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getStudentSessions = async () => {
  try {
    const response = await api.get("/feedback-session/student/active");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getAllFeedbackSessions = async () => {
  try {
    const response = await api.get("/feedback-session/list");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const submitFeedback = async (data) => {
  try {
    const response = await api.post("/feedback-session/submit", data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getSessionResponses = async (sessionId) => {
  try {
    const response = await api.get(`/feedback-session/responses/${sessionId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Course File APIs
export const getMyCourseAssignments = async () => {
  try {
    const response = await api.get("/course-file-assignment/my-list");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getClassCourseAssignments = async (classId) => {
  try {
    const response = await api.get(`/course-file-assignment/class/${classId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getDepartmentCourseAssignments = async () => {
  try {
    const response = await api.get("/course-file-assignment/department/list");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getCourseTasks = async () => {
  try {
    const response = await api.get("/course-file-submission/my-tasks");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getComplianceAlerts = async () => {
  try {
    const response = await api.get("/course-file-submission/compliance-alerts");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getAssignmentTasks = async (assignmentId) => {
  try {
    const response = await api.get(
      `/course-file-submission/assignment/${assignmentId}/tasks`,
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getReviewableTasks = async (assignmentId) => {
  try {
    const response = await api.get(
      `/course-file-submission/assignment/${assignmentId}/reviewable-tasks`,
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getSubjectReviewableTasks = async (subjectId) => {
  try {
    const response = await api.get(
      `/course-file-submission/subject/${subjectId}/reviewable-tasks`,
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const completeCourseTask = async (taskId) => {
  try {
    const response = await api.patch(
      `/course-file-submission/complete/${taskId}`,
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const reviewCourseTask = async (taskId, status, remarks) => {
  try {
    const response = await api.patch(
      `/course-file-submission/review/${taskId}`,
      { status, remarks },
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateCourseFileTaskDeadline = async (taskId, deadline) => {
  try {
    const response = await api.patch(
      `/course-file-submission/deadline/${taskId}`,
      { deadline },
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const batchReviewCourseTasks = async (assignmentId, status, remarks) => {
  try {
    const response = await api.patch(
      `/course-file-submission/assignment/${assignmentId}/batch-review`,
      { status, remarks },
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getCourseFileTemplates = async () => {
  try {
    const response = await api.get("/course-file/list"); // Prefix from server.js
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateCourseFileTemplate = async (id, data) => {
  try {
    const response = await api.patch(`/course-file/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getClassSubjects = async (classId) => {
  try {
    const response = await api.get(`/subject/${classId}/subjects`);
    return response.data;
  } catch (error) {
    // Return empty subjects array on error to show friendly empty state
    return { subjects: [] };
  }
};

export const createClassSubject = async (classId, name) => {
  try {
    const response = await api.post(`/subject/${classId}/subject/create`, {
      name,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateClassSubject = async (subjectId, name) => {
  try {
    const response = await api.patch(`/subject/${subjectId}`, { name });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const deleteClassSubject = async (subjectId) => {
  try {
    const response = await api.delete(`/subject/${subjectId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const assignFacultyToClassSubject = async (subjectId, facultyIds) => {
  try {
    const response = await api.patch(`/subject/${subjectId}/assign-faculty`, {
      facultyIds,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export default api;
