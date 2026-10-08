// src/api/teachers.js
import api from './axios';

export const getTeachers = async () => {
  const { data } = await api.get('/teachers');
  return data;
};

export const getTeacherById = async (id) => {
  const { data } = await api.get(`/teachers/${id}`);
  return data;
};

export const saveTeacher = async (payload, id = null) => {
  const { data } = id 
    ? await api.put(`/teachers/${id}`, payload)
    : await api.post('/teachers', payload);
  return data;
};

export const deleteTeacher = async (id) => {
  const { data } = await api.delete(`/teachers/${id}`);
  return data;
};

export const addUnavailability = async (teacherId, payload) => {
  const { data } = await api.post(`/teachers/${teacherId}/unavailability`, payload);
  return data;
};

export const getUnavailabilities = async (teacherId) => {
  const { data } = await api.get(`/teachers/${teacherId}/unavailability`);
  return data;
};

export default {
  getTeachers,
  getTeacherById,
  saveTeacher,
  deleteTeacher,
  addUnavailability,
  getUnavailabilities,
};