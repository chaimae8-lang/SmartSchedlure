// src/api/ai.js
import api from './axios';

export const askAI = async (prompt, context = {}) => {
  try {
    const payload = {
      prompt,
      schedule_context: {
        conflicts: context.conflicts || [],
        teacher_workload_summary: context.teacher_workload_summary || {},
        specific_slot: context.specific_slot || null,
      }
    };

    const { data } = await api.post('/ai/suggest', payload);
    return data;
  } catch (error) {
    console.error("AI API Error:", error.response?.data || error);
    throw error;
  }
};