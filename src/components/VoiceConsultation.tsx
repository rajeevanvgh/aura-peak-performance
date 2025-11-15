import { useState, useEffect } from 'react';
import Vapi from '@vapi-ai/web';
import { toast } from 'sonner';

interface VoiceConsultationProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TranscriptMessage {
  role: string;
  text: string;
  timestamp: Date;
}

const VoiceConsultation = ({ isOpen, onClose }: VoiceConsultationProps) => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);

  useEffect(() => {
    const vapiInstance = new Vapi('0e533ffc-4b5d-4557-825c-8718a91ea93a');
    setVapi(vapiInstance);

    vapiInstance.on('call-start', () => setIsCallActive(true));
    vapiInstance.on('call-end', () => {
      setIsCallActive(false);
      setIsSpeaking(false);
    });
    vapiInstance.on('speech-start', () => setIsSpeaking(true));
    vapiInstance.on('speech-end', () => setIsSpeaking(false));
    vapiInstance.on('message', (message: any) => {
      if (message.type === 'transcript') {
        setTranscript(prev => [...prev, {
          role: message.role,
          text: message.transcript,
          timestamp: new Date()
        }]);
      }
    });

    return () => {
      vapiInstance.stop();
    };
  }, []);

  const startCall = async () => {
    if (!vapi) {
      toast.error('Voice service not available');
      return;
    }

    try {
      await vapi.start({
        name: 'AuraQ Wellness Coach',
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: `You are AuraQ's AI Wellness Coach - compassionate, knowledgeable about fitness and mental health.

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
- Keep responses under 45 seconds
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
          }],
          temperature: 0.8
        },
        voice: {
          provider: '11labs',
          voiceId: 'rachel'
        },
        firstMessage: "Hey there! I'm your AuraQ wellness coach. Whether you're looking to start a fitness journey or need support with motivation and mental wellness, I'm here to help. What's on your mind today?"
      });
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Could not start call. Please try again.');
    }
  };

  const endCall = () => {
    if (vapi) vapi.stop();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-deep-charcoal rounded-2xl shadow-2xl max-w-2xl w-full border border-auro-gold/30">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-auro-gold/20 to-electric-blue/20 p-6 border-b border-auro-gold/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-auro-gold flex items-center justify-center text-2xl">
                🧘
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">AuraQ Wellness Coach</h2>
                <p className="text-soft-graphite text-sm">Physical & Mental Fitness Support</p>
              </div>
            </div>
            <button onClick={onClose} className="text-soft-graphite hover:text-white transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {!isCallActive ? (
            // Start Screen
            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-full bg-auro-gold/20 flex items-center justify-center mb-6">
                <svg className="w-16 h-16 text-auro-gold" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </div>
              
              <h3 className="text-white text-2xl font-bold mb-4">
                Free AI Wellness Consultation
              </h3>
              
              <p className="text-soft-graphite mb-6 leading-relaxed max-w-lg mx-auto">
                Get personalized guidance for starting your fitness journey or support with motivation 
                and mental wellness challenges. No signup required.
              </p>
              
              <div className="bg-electric-blue/10 border border-electric-blue/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-white">
                  <strong className="text-electric-blue">We can help with:</strong><br/>
                  Starting fitness routines • Goal setting • Motivation & energy<br/>
                  Overcoming anxiety • Depression support • Building habits
                </p>
              </div>

              <button
                onClick={startCall}
                className="bg-auro-gold hover:bg-auro-gold/90 text-deep-charcoal font-bold py-4 px-8 rounded-lg text-lg transition-all hover:scale-105 mb-4">
                🎤 Start Voice Consultation
              </button>
              
              <p className="text-soft-graphite text-xs">
                Your microphone will be accessed for this call
              </p>
            </div>
          ) : (
            // Active Call Screen
            <div>
              <div className="text-center mb-6">
                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 transition-all ${
                  isSpeaking ? 'bg-auro-gold animate-pulse scale-110' : 'bg-auro-gold/20'
                }`}>
                  <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                </div>
                
                <h3 className="text-white text-xl font-semibold mb-2">
                  {isSpeaking ? 'Coach is speaking...' : 'Listening...'}
                </h3>
                <p className="text-soft-graphite text-sm">
                  Speak naturally about your fitness or wellness concerns
                </p>
              </div>

              {/* Transcript */}
              {transcript.length > 0 && (
                <div className="bg-deep-charcoal/50 rounded-lg p-4 max-h-64 overflow-y-auto mb-6 space-y-3">
                  {transcript.map((msg, idx) => (
                    <div key={idx} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block px-4 py-2 rounded-lg max-w-[85%] ${
                        msg.role === 'user'
                          ? 'bg-auro-gold/20 text-white'
                          : 'bg-electric-blue/20 text-white border border-electric-blue/30'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={endCall}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-lg transition-all">
                End Consultation
              </button>
            </div>
          )}
        </div>

        {/* Sign-Up CTA (shows after conversation starts) */}
        {transcript.length > 3 && (
          <div className="p-6 bg-gradient-to-r from-auro-gold/20 to-electric-blue/20 border-t border-auro-gold/30">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h4 className="text-white font-semibold">Ready to start your journey?</h4>
                <p className="text-soft-graphite text-sm">Sign up to track your goals and progress</p>
              </div>
              <button 
                onClick={() => { onClose(); }}
                className="bg-auro-gold hover:bg-auro-gold/90 text-deep-charcoal font-bold py-3 px-6 rounded-lg transition-all">
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceConsultation;
