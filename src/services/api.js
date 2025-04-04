import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001'; // Your Flask backend URL

export const fetchSBOMs = async () => {
  const response = await axios.get(`${API_BASE_URL}/sboms`);
  return response.data;
};

export const searchSBOM = async (keyword) => {
  const response = await axios.get(`${API_BASE_URL}/search`, {
    params: { keyword }
  });
  return response.data;
};
