import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('N8N_COMPLETION_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('N8N_COMPLETION_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const completionData = await req.json();
    console.log('Sending goal completion notification for:', completionData.goalTitle);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: completionData.userName,
        userEmail: completionData.userEmail,
        goalTitle: completionData.goalTitle,
        goalType: completionData.goalType,
        targetValue: completionData.targetValue,
        achievedValue: completionData.achievedValue,
        unit: completionData.unit,
        startDate: completionData.startDate,
        completionDate: completionData.completionDate,
        durationDays: completionData.durationDays,
        totalActivities: completionData.totalActivities,
        goalId: completionData.goalId
      })
    });

    if (!response.ok) {
      console.error('Webhook failed:', response.status, response.statusText);
      throw new Error('Webhook request failed');
    }

    console.log('Goal completion notification sent successfully');
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Goal completion notification error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
