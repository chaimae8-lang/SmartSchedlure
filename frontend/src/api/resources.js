// src/api/resources.js
import api from './axios';

export const listClasses = async () => {
  const { data } = await api.get('/classes');
  return data;
};

export const saveClass = async (payload, id = null) => {
  const { data } = id 
    ? await api.put(`/classes/${id}`, payload)
    : await api.post('/classes', payload);
  return data;
};

export const listRooms = async () => {
  const { data } = await api.get('/rooms');
  return data;
};

export const saveRoom = async (payload, id = null) => {
  const { data } = id 
    ? await api.put(`/rooms/${id}`, payload)
    : await api.post('/rooms', payload);
  return data;
};

export const listSubjects = async () => {
  const { data } = await api.get('/subjects');
  return data;
};

export const saveSubject = async (payload, id = null) => {
  const { data } = id 
    ? await api.put(`/subjects/${id}`, payload)
    : await api.post('/subjects', payload);
  return data;
};

export const listFilieres = async () => {
  const { data } = await api.get('/filieres');
  return data;
};

export default {
  listClasses,
  saveClass,
  listRooms,
  saveRoom,
  listSubjects,
  saveSubject,
  listFilieres,
};