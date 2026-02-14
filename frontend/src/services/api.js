import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const scanURL = async (url) => {
  const response = await axios.post(`${API_URL}/scan/url`, { url });
  return response.data;
};

export const scanIP = async (ip_address) => {
  const response = await axios.post(`${API_URL}/scan/ip`, { ip_address });
  return response.data;
};

export const scanFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_URL}/scan/file`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await axios.get(`${API_URL}/dashboard/stats`);
  return response.data;
};

export const getScanHistory = async () => {
  const response = await axios.get(`${API_URL}/scans/history`);
  return response.data;
};

export const getAdminStats = async () => {
  const response = await axios.get(`${API_URL}/admin/stats`);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await axios.delete(`${API_URL}/admin/users/${userId}`);
  return response.data;
};