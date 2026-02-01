import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your actual backend IP address if testing on device
// For Android Emulator use 'http://10.0.2.2:3002'
// For iOS Simulator use 'http://localhost:3002'
// For Android Emulator use 'http://10.0.2.2:3002'
// For Physical Device use your machine's IP: 'http://192.168.x.x:3002'
const BASE_URL = 'http://192.168.1.7:3001'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const loginUser = async (userId, password) => {
  try {
    const response = await api.post('/auth/login', { userId, password });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getMyProfile = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const changePassword = async (newPassword) => {
  try {
    const response = await api.patch('/auth/change-password', { newPassword });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await api.post('/user/create', userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const promoteToCC = async (facultyId, classId) => {
  try {
    const response = await api.patch('/user/make-CC', { facultyId, classId });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getUsers = async (role) => {
  try {
    const response = await api.get(`/user/list${role ? `?role=${role}` : ''}`);
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
  await SecureStore.setItemAsync('userToken', token);
};

export const getToken = async () => {
    return await SecureStore.getItemAsync('userToken');
}

export const clearToken = async () => {
  await SecureStore.deleteItemAsync('userToken');
};

export const createDepartment = async (data) => {
  try {
    const response = await api.post('/department/create', data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createSemester = async (data) => {
  try {
    const response = await api.post('/semester/create', data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createClass = async (data) => {
  try {
    const response = await api.post('/class/add', data);
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
    const response = await api.patch('/class/assign-cc', data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createStudent = async (data) => {
  try {
    const response = await api.post('/class/student/create', data);
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
    const response = await api.patch('/class/student/reset-password', { studentId });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateStudentDetails = async (data) => {
  try {
    const response = await api.patch('/class/student/update', data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const assignStudentPool = async (studentId, poolId) => {
  try {
    const response = await api.patch('/class/pool/add', { studentId, poolId });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export default api;
