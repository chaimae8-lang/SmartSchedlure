// src/api/schedule.js
import api from './axios';

export const generateSchedule = async (academic_year_id) => {
  const { data } = await api.post('/schedule/generate', { academic_year_id });
  return data;
};

export const getStatus = async () => {
  const { data } = await api.get('/schedule/status');
  return data;
};

export const getSchedule = async (yearId = 1) => {
  const { data } = await api.get(`/schedule/${yearId}`);
  return data;
};

export const getConflicts = async (yearId = 1) => {
  const { data } = await api.get(`/schedule/${yearId}/conflicts`);
  return data;
};

export const moveSlot = async (slotId, payload) => {
  const { data } = await api.patch(`/schedule/slot/${slotId}`, payload);
  return data;
};

export default {
  generateSchedule,
  getStatus,
  getSchedule,
  getConflicts,
  moveSlot,
};



