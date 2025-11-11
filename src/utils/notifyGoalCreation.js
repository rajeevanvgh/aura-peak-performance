import { WEBHOOK_CONFIG } from '@/config/webhook';

export const notifyGoalCreation = async (goalData, userData, enabled = true) => {
  if (!enabled) return { success: true };

  try {
    const response = await fetch(WEBHOOK_CONFIG.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      })
    });

    if (!response.ok) throw new Error('Webhook failed');
    return { success: true };
  } catch (error) {
    console.error('Notification error:', error);
    return { success: false };
  }
};
