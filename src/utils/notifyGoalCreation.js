import { supabase } from '@/integrations/supabase/client';

export const notifyGoalCreation = async (goalData, userData, enabled = true) => {
  if (!enabled) return { success: true };

  try {
    const { data, error } = await supabase.functions.invoke('notify-goal', {
      body: {
        userName: userData.name || userData.displayName || userData.email.split('@')[0],
        userEmail: userData.email,
        goalTitle: goalData.title,
        goalType: goalData.type,
        targetValue: goalData.targetValue,
        unit: goalData.unit,
        startDate: goalData.startDate,
        endDate: goalData.endDate,
        createdAt: new Date().toISOString(),
        goalId: goalData.id
      }
    });

    if (error) {
      console.error('Notification error:', error);
      return { success: false };
    }

    return data || { success: true };
  } catch (error) {
    console.error('Notification error:', error);
    return { success: false };
  }
};
