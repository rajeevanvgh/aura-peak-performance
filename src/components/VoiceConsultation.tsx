import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChat } from '@/utils/RealtimeAudio';

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
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const chatRef = useRef<RealtimeChat | null>(null);

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  const handleMessage = (event: any) => {
    console.log('Received message:', event);
    
    if (event.type === 'response.audio_transcript.delta') {
      setTranscript(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((msg, i) => 
            i === prev.length - 1 
              ? { ...msg, text: msg.text + event.delta }
              : msg
          );
        }
        return [...prev, {
          role: 'assistant',
          text: event.delta,
          timestamp: new Date()
        }];
      });
    } else if (event.type === 'conversation.item.input_audio_transcription.completed') {
      setTranscript(prev => [...prev, {
        role: 'user',
        text: event.transcript,
        timestamp: new Date()
      }]);
    } else if (event.type === 'response.audio.delta') {
      setIsSpeaking(true);
    } else if (event.type === 'response.audio.done') {
      setIsSpeaking(false);
    } else if (event.type === 'error') {
      console.error('Error:', event.error);
      toast.error(event.error.message || 'An error occurred');
    }
  };

  const startCall = async () => {
    setIsConnecting(true);
    
    try {
      // Get ephemeral token from edge function
      const { data, error } = await supabase.functions.invoke('voice-consultation');
      
      if (error) {
        throw new Error(error.message);
      }

      // Initialize WebRTC chat
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init({ data });
      
      setIsCallActive(true);
      setIsConnecting(false);
      toast.success('Connected to wellness coach');
      
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error(error instanceof Error ? error.message : 'Could not start call');
      setIsConnecting(false);
    }
  };

  const endCall = () => {
    chatRef.current?.disconnect();
    setIsCallActive(false);
    setIsSpeaking(false);
    setTranscript([]);
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
          {!isCallActive && !isConnecting ? (
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
          ) : isConnecting ? (
            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-full bg-auro-gold/20 flex items-center justify-center mb-6 animate-pulse">
                <svg className="w-16 h-16 text-auro-gold" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">Connecting...</h3>
              <p className="text-soft-graphite text-sm">Setting up your wellness consultation</p>
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
