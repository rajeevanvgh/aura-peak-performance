import { supabase } from '@/integrations/supabase/client';

interface GoalData {
  id: string;
  title: string;
  type: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
}

interface UserData {
  name?: string;
  displayName?: string;
  email: string;
}

export const notifyGoalCompletion = async (
  goalData: GoalData, 
  userData: UserData, 
  totalActivities: number
) => {
  try {
    const startDate = new Date(goalData.startDate);
    const completionDate = new Date();
    const durationDays = Math.ceil((completionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const { data, error } = await supabase.functions.invoke('notify-goal-completion', {
      body: {
        userName: userData.name || userData.displayName || userData.email.split('@')[0],
        userEmail: userData.email,
        goalTitle: goalData.title,
        goalType: goalData.type,
        targetValue: goalData.targetValue,
        achievedValue: goalData.currentValue,
        unit: goalData.unit,
        startDate: goalData.startDate,
        completionDate: completionDate.toISOString(),
        durationDays: durationDays,
        totalActivities: totalActivities,
        goalId: goalData.id
      }
    });

    if (error) {
      console.error('Goal completion notification error:', error);
      return { success: false };
    }

    return data || { success: true };
  } catch (error) {
    console.error('Goal completion notification error:', error);
    return { success: false };
  }
};
