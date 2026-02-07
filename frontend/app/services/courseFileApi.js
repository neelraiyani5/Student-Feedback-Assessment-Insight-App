import api from "./api";

// ==================== COURSE FILE APIs ====================

// Faculty - Get my course file tasks
export const getFacultyCourseTasks = async () => {
  const response = await api.get("/course-file-submission/my-tasks");
  return response.data;
};

// Faculty - Complete a task
export const completeCourseTask = async (taskId) => {
  const response = await api.patch(
    `/course-file-submission/complete/${taskId}`,
  );
  return response.data;
};

// CC - Get reviewable tasks (only COMPLETED)
export const getCCReviewableTasks = async (assignmentId) => {
  const response = await api.get(
    `/course-file-submission/assignment/${assignmentId}/reviewable-tasks`,
  );
  return response.data;
};

// HOD - Get semesters
export const getHodSemesters = async () => {
  const response = await api.get("/hod-course-file/semesters");
  return response.data;
};

// HOD - Get subjects in semester
export const getHodSemesterSubjects = async (semesterId) => {
  const response = await api.get(
    `/hod-course-file/semester/${semesterId}/subjects`,
  );
  return response.data;
};

// HOD - Get reviewable tasks
export const getHodReviewableTasks = async (assignmentId) => {
  const response = await api.get(
    `/hod-course-file/assignment/${assignmentId}/tasks`,
  );
  return response.data;
};
// HOD/CC - Get reviewable tasks for specific subject (bypasses semester/subject selection)
export const getSubjectReviewableTasks = async (subjectId) => {
  const response = await api.get(
    `/course-file-submission/subject/${subjectId}/reviewable-tasks`,
  );
  return response.data;
};
// HOD - Get compliance summary
export const getHodComplianceSummary = async () => {
  const response = await api.get("/hod-course-file/compliance-summary");
  return response.data;
};

// Review a task (CC or HOD)
export const reviewCourseFileTask = async (taskId, status, remarks) => {
  const response = await api.patch(`/course-file-submission/review/${taskId}`, {
    status,
    remarks: remarks || "",
  });
  return response.data;
};

// Get activity logs
export const getCourseFileActivityLogs = async () => {
  const response = await api.get("/course-file-log");
  return response.data;
};

// Get logs for specific course file assignment
export const getCourseFileLogs = async (assignmentId) => {
  const response = await api.get(`/course-file-log/assignment/${assignmentId}`);
  return response.data;
};

// Clear logs for specific course file assignment
export const clearCourseFileLogs = async (assignmentId) => {
  const response = await api.delete(
    `/course-file-log/assignment/${assignmentId}`,
  );
  return response.data;
};

export default api;
