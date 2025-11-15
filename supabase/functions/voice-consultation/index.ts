import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

Deno.serve(async (req) => {
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected websocket", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let openaiWs: WebSocket | null = null;

  socket.onopen = () => {
    console.log("Client connected");
    
    // Connect to OpenAI Realtime API
    openaiWs = new WebSocket(
      "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "realtime=v1"
        }
      }
    );

    openaiWs.onopen = () => {
      console.log("Connected to OpenAI");
    };

    openaiWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("OpenAI message:", data.type);
      
      // Send session.update after session.created
      if (data.type === 'session.created') {
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
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

Remember: Guide them toward their first fitness goal and encourage AuraQ signup!`,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            temperature: 0.8
          }
        };
        openaiWs?.send(JSON.stringify(sessionConfig));
        console.log("Session configured");
      }
      
      // Forward all OpenAI messages to client
      socket.send(event.data);
    };

    openaiWs.onerror = (error) => {
      console.error("OpenAI WebSocket error:", error);
      socket.send(JSON.stringify({ 
        type: 'error', 
        error: 'OpenAI connection error' 
      }));
    };

    openaiWs.onclose = () => {
      console.log("OpenAI disconnected");
      socket.close();
    };
  };

  socket.onmessage = (event) => {
    // Forward client messages to OpenAI
    if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.send(event.data);
    }
  };

  socket.onclose = () => {
    console.log("Client disconnected");
    openaiWs?.close();
  };

  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
    openaiWs?.close();
  };

  return response;
});
