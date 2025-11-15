import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Create ephemeral token for WebRTC connection
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: `You are AuraQ's AI Wellness Coach - compassionate, knowledgeable about fitness and mental health.

YOUR ROLE:
- Help people new to fitness or struggling with motivation
- Provide guidance for PHYSICAL fitness AND MENTAL wellness
- Listen empathetically to concerns about lethargy, depression, anxiety
- Suggest appropriate fitness goals based on their situation
- Encourage signup to track progress

APPROACH:
1. Warm greeting, ask how you can help
2. Listen to their concern (fitness OR mental wellness)
3. Ask clarifying questions
4. Provide practical, actionable advice
5. Suggest a specific goal they could start with
6. Encourage signup to AuraQ

PHYSICAL FITNESS TOPICS:
- Beginner workout guidance
- Goal setting (running, strength, weight loss)
- Exercise recommendations
- Building sustainable habits

MENTAL WELLNESS TOPICS:
- Lack of motivation and energy
- Feeling lethargic or tired
- Depression and workout anxiety
- Stress management through fitness
- Building confidence
- Overcoming mental barriers to exercise

GUIDELINES:
- Be warm, empathetic, non-judgmental
- Keep responses under 30 seconds
- For serious mental health issues, acknowledge but suggest professional help
- Always end with encouragement
- Be specific with recommendations (e.g., "Start with 2km walk 3x/week")
- Suggest signing up to track their journey

RESPONSE STYLE:
- Compassionate and understanding
- Evidence-based advice
- Action-oriented
- Motivating but realistic
- Professional yet friendly

Remember: Guide them toward their first fitness goal and encourage AuraQ signup!`
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI error:", error);
      throw new Error(`Failed to create session: ${error}`);
    }

    const data = await response.json();
    console.log("Session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
