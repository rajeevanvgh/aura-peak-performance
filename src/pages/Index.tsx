import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Calendar, Trophy, TrendingUp, Target, Plus, X, Edit2, Trash2, 
  LogIn, UserPlus, User, Activity, Award, Clock, Zap 
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ProgressRing';
import { ProgressBar } from '@/components/ProgressBar';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { signUpSchema, signInSchema, goalSchema, activitySchema } from '@/lib/validations';
import { useToast } from '@/hooks/use-toast';
import { notifyGoalCreation } from '@/utils/notifyGoalCreation';
import { toast as sonnerToast } from 'sonner';

// Types
interface User {
  id: string;
  name: string;
  email: string;
}

interface Goal {
  id: string;
  userId: string;
  type: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

interface ActivityLog {
  id: string;
  goalId: string;
  userId: string;
  date: string;
  value: number;
  notes?: string;
}

// Utility functions
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const calculateProgress = (current: number, target: number) => {
  return Math.min(Math.round((current / target) * 100), 100);
};

const getDaysRemaining = (endDate: string) => {
  const diff = new Date(endDate).getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export default function Index() {
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const { toast } = useToast();

  // Set up auth state listener and load data
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setAuthUser(session?.user ?? null);
      
      // Load user data when authenticated
      if (session?.user) {
        setTimeout(() => {
          loadUserData(session.user.id);
        }, 0);
      } else {
        setUser(null);
        setGoals([]);
        setActivities([]);
        setCurrentView('landing');
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Load user from profiles table
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (userData) {
        setUser(userData);
        setCurrentView('dashboard');
        
        // Load goals
        const { data: goalsData } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userData.id);
        
        if (goalsData) {
          const formattedGoals: Goal[] = goalsData.map(g => ({
            id: g.id,
            userId: g.user_id,
            type: g.type,
            title: g.title,
            targetValue: g.target_value,
            currentValue: g.current_value,
            unit: g.unit,
            startDate: g.start_date,
            endDate: g.end_date,
            status: g.status as 'active' | 'completed' | 'paused',
            createdAt: g.created_at
          }));
          setGoals(formattedGoals);
        }
        
        // Load activities
        const { data: activitiesData } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', userData.id);
        
        if (activitiesData) {
          const formattedActivities = activitiesData.map(a => ({
            id: a.id,
            goalId: a.goal_id,
            userId: a.user_id,
            date: a.date,
            value: a.value,
            notes: a.notes
          }));
          setActivities(formattedActivities);
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load user data'
      });
    }
  };


  // Components
  const LandingPage = () => (
    <div className="min-h-screen bg-deep-charcoal">
      <nav className="fixed top-0 w-full bg-deep-charcoal/80 backdrop-blur-lg border-b border-white/10 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Logo size="medium" className="hover:opacity-80 transition-opacity cursor-pointer" />
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setCurrentView('login')}
              className="gap-2"
            >
              <LogIn size={20} />
              Sign In
            </Button>
            <Button 
              onClick={() => setCurrentView('signup')}
              className="gap-2 bg-auro-gold text-deep-charcoal hover:bg-auro-gold/90"
            >
              <UserPlus size={20} />
              Get Started
            </Button>
          </div>
        </div>
      </nav>
      
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Logo size="hero" className="mx-auto mb-8" animate />
          <h1 className="text-6xl md:text-7xl font-heading font-bold text-foreground mb-6 leading-tight">
            Activate Your <span className="text-auro-gold">Potential</span>
          </h1>
          <p className="text-xl text-soft-graphite mb-12 max-w-2xl mx-auto">
            Where Energy Meets Precision. Train Smart. Shine Strong.
          </p>
          <Button 
            onClick={() => setCurrentView('signup')}
            className="text-lg px-8 py-6 gap-2 bg-auro-gold text-deep-charcoal hover:bg-auro-gold/90 hover:scale-105"
          >
            <Zap size={24} />
            Start Your Journey
          </Button>
        </div>
        
        <div className="max-w-6xl mx-auto mt-20 grid md:grid-cols-3 gap-6">
          <GlassCard hover className="text-center">
            <Target className="mx-auto mb-4 text-auro-gold" size={48} />
            <h3 className="text-xl font-heading font-bold text-foreground mb-2">Smart Goals</h3>
            <p className="text-soft-graphite">Set personalized fitness targets and track your progress in real-time</p>
          </GlassCard>
          <GlassCard hover className="text-center">
            <Activity className="mx-auto mb-4 text-electric-blue" size={48} />
            <h3 className="text-xl font-heading font-bold text-foreground mb-2">Live Analytics</h3>
            <p className="text-soft-graphite">Visualize your performance with beautiful, insightful charts</p>
          </GlassCard>
          <GlassCard hover className="text-center">
            <Award className="mx-auto mb-4 text-auro-gold" size={48} />
            <h3 className="text-xl font-heading font-bold text-foreground mb-2">Achievements</h3>
            <p className="text-soft-graphite">Celebrate milestones and build momentum with streak tracking</p>
          </GlassCard>
        </div>
      </div>
      
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="small" />
            <span className="text-soft-graphite text-sm">© {new Date().getFullYear()} AuraQ. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-soft-graphite">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );

  const AuthForm = ({ type }: { type: 'login' | 'signup' }) => {
    const [formData, setFormData] = useState({ 
      email: '', 
      password: '', 
      name: '',
      age: '',
      gender: '',
      fitnessLevel: ''
    });
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      
      try {
        if (type === 'login') {
          // Validate login data
          const loginData = signInSchema.parse({
            email: formData.email,
            password: formData.password
          });
          
          const { error } = await supabase.auth.signInWithPassword({
            email: loginData.email,
            password: loginData.password
          });
          
          if (error) {
            toast({
              variant: 'destructive',
              title: 'Login failed',
              description: error.message
            });
            return;
          }
          
          toast({
            title: 'Success',
            description: 'Welcome back!'
          });
        } else {
          // Validate signup data
          const signUpData = signUpSchema.parse({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            age: parseInt(formData.age),
            gender: formData.gender as 'male' | 'female' | 'other',
            fitnessLevel: formData.fitnessLevel as 'beginner' | 'intermediate' | 'advanced'
          });
          
          const redirectUrl = `${window.location.origin}/`;
          
          const { data, error } = await supabase.auth.signUp({
            email: signUpData.email,
            password: signUpData.password,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                name: signUpData.name,
                age: signUpData.age,
                gender: signUpData.gender,
                fitness_level: signUpData.fitnessLevel
              }
            }
          });
          
          if (error) {
            toast({
              variant: 'destructive',
              title: 'Signup failed',
              description: error.message
            });
            return;
          }
          
          // Profile is automatically created by database trigger
          toast({
            title: 'Success',
            description: 'Account created successfully!'
          });
        }
      } catch (error: any) {
        if (error.errors) {
          // Zod validation errors
          const firstError = error.errors[0];
          toast({
            variant: 'destructive',
            title: 'Validation error',
            description: firstError.message
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'An unexpected error occurred'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-deep-charcoal flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full">
          <div className="text-center mb-8">
            <Logo size="large" className="mx-auto mb-4" />
            <p className="text-soft-graphite">{type === 'login' ? 'Welcome back' : 'Start your journey'}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="email" 
              placeholder="Email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-soft-graphite focus:outline-none focus:border-electric-blue transition-colors" 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-soft-graphite focus:outline-none focus:border-electric-blue transition-colors" 
            />
            
            {type === 'signup' && (
              <>
                <input 
                  type="text" 
                  placeholder="Name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-soft-graphite focus:outline-none focus:border-electric-blue transition-colors" 
                />
                <select
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  size={1}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-electric-blue transition-colors [&>option]:bg-deep-charcoal [&>option]:text-foreground appearance-none cursor-pointer"
                >
                  <option value="" className="bg-deep-charcoal text-foreground">Select Age</option>
                  {Array.from({ length: 63 }, (_, i) => i + 18).map(age => (
                    <option key={age} value={age} className="bg-deep-charcoal text-foreground">{age}</option>
                  ))}
                </select>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  size={1}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-electric-blue transition-colors [&>option]:bg-deep-charcoal [&>option]:text-foreground appearance-none cursor-pointer"
                >
                  <option value="" className="bg-deep-charcoal text-foreground">Select Gender</option>
                  <option value="male" className="bg-deep-charcoal text-foreground">Male</option>
                  <option value="female" className="bg-deep-charcoal text-foreground">Female</option>
                  <option value="other" className="bg-deep-charcoal text-foreground">Other</option>
                </select>
                <select
                  value={formData.fitnessLevel}
                  onChange={(e) => setFormData({...formData, fitnessLevel: e.target.value})}
                  size={1}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-electric-blue transition-colors [&>option]:bg-deep-charcoal [&>option]:text-foreground appearance-none cursor-pointer"
                >
                  <option value="" className="bg-deep-charcoal text-foreground">Select Fitness Level</option>
                  <option value="beginner" className="bg-deep-charcoal text-foreground">Beginner</option>
                  <option value="intermediate" className="bg-deep-charcoal text-foreground">Intermediate</option>
                  <option value="advanced" className="bg-deep-charcoal text-foreground">Advanced</option>
                </select>
              </>
            )}
            
            <Button 
              type="submit"
              disabled={loading}
              className="w-full justify-center bg-auro-gold text-deep-charcoal hover:bg-auro-gold/90"
            >
              {loading ? 'Please wait...' : type === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
            
            <button 
              type="button"
              onClick={() => setCurrentView(type === 'login' ? 'signup' : 'login')} 
              className="w-full text-sm text-soft-graphite hover:text-foreground transition-colors"
            >
              {type === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </form>
        </GlassCard>
      </div>
    );
  };

  const StatCard = ({ icon: Icon, label, value, trend }: { 
    icon: any; 
    label: string; 
    value: string | number; 
    trend?: string 
  }) => (
    <GlassCard hover>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-soft-graphite text-sm mb-2">
            <Icon size={18} />
            <span className="font-body">{label}</span>
          </div>
          <div className="text-3xl font-stats font-bold text-foreground mb-1">{value}</div>
          {trend && (
            <div className="flex items-center gap-1 text-electric-blue text-sm">
              <TrendingUp size={14} />
              <span>{trend}</span>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );

  const Dashboard = () => {
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedThisWeek = activities.filter(a => {
      const actDate = new Date(a.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return actDate >= weekAgo;
    }).length;
    
    const weeklyData = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayActivities = activities.filter(a => 
        new Date(a.date).toDateString() === date.toDateString()
      );
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: dayActivities.reduce((sum, a) => sum + (a.value || 0), 0)
      };
    });

    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-soft-graphite">Train Smart. Shine Strong.</p>
          </div>
          <Button 
            onClick={() => setShowModal('newGoal')}
            className="gap-2 bg-auro-gold text-deep-charcoal hover:bg-auro-gold/90"
          >
            <Plus size={20} />
            New Goal
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <StatCard icon={Target} label="Active Goals" value={activeGoals} trend="+2 this month" />
          <StatCard icon={Activity} label="Weekly Activities" value={completedThisWeek} trend="+15% from last week" />
          <StatCard icon={Trophy} label="Current Streak" value="12 days" trend="Personal best!" />
        </div>

        <GlassCard>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-6">Weekly Progress</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="hsl(var(--soft-graphite))" />
              <YAxis stroke="hsl(var(--soft-graphite))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--deep-charcoal))', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px',
                  color: 'hsl(var(--foreground))'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--auro-gold))" 
                strokeWidth={3} 
                dot={{ fill: 'hsl(var(--auro-gold))', r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-6">Your Goals</h2>
          {goals.length === 0 ? (
            <GlassCard className="text-center py-12">
              <Target className="mx-auto mb-4 text-soft-graphite" size={48} />
              <p className="text-soft-graphite mb-4">No goals yet. Create your first goal to get started!</p>
              <Button 
                onClick={() => setShowModal('newGoal')}
                className="bg-auro-gold text-deep-charcoal hover:bg-auro-gold/90"
              >
                Create Goal
              </Button>
            </GlassCard>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map(goal => {
                const progress = calculateProgress(goal.currentValue, goal.targetValue);
                return (
                  <GlassCard 
                    key={goal.id} 
                    hover 
                    className="cursor-pointer" 
                    onClick={() => {
                      setSelectedGoal(goal);
                      setShowModal('goalDetail');
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-heading font-bold text-foreground mb-2">{goal.title}</h3>
                        <Badge variant="secondary" className="bg-electric-blue/20 text-electric-blue border-electric-blue/30">
                          {goal.type}
                        </Badge>
                      </div>
                      <ProgressRing progress={progress} size={80} />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm text-soft-graphite mb-1">
                          <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                          <span>{progress}%</span>
                        </div>
                        <ProgressBar progress={progress} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-soft-graphite flex items-center gap-1">
                          <Clock size={14} />
                          {getDaysRemaining(goal.endDate)} days left
                        </span>
                        <Badge 
                          variant={goal.status === 'active' ? 'default' : 'secondary'}
                          className={goal.status === 'active' ? 'bg-auro-gold/20 text-auro-gold border-auro-gold/30' : ''}
                        >
                          {goal.status}
                        </Badge>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const Modal = ({ isOpen, onClose, title, children }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <GlassCard className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold text-foreground">{title}</h2>
            <button onClick={onClose} className="text-foreground/60 hover:text-foreground transition-colors">
              <X size={24} />
            </button>
          </div>
          {children}
        </GlassCard>
      </div>
    );
  };

  const CreateGoalModal = () => {
    const unitOptions: Record<string, string[]> = {
      Distance: ['km', 'miles', 'meters'],
      Duration: ['hours', 'minutes', 'sessions'],
      Frequency: ['times per week', 'reps', 'sessions per month'],
      Weight: ['kg', 'lbs', 'pounds']
    };

    const [goalData, setGoalData] = useState({
      type: 'Distance',
      title: '',
      targetValue: '',
      unit: 'km',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
    const [emailNotify, setEmailNotify] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Auto-select unit when goal type changes
    useEffect(() => {
      if (goalData.type && unitOptions[goalData.type]) {
        setGoalData(prev => ({ ...prev, unit: unitOptions[prev.type][0] }));
      }
    }, [goalData.type]);

    const handleSubmit = async () => {
      if (!user) return;
      
      // Clear previous errors
      setErrors({});
      
      // Client-side validation
      const newErrors: Record<string, string> = {};
      
      if (!goalData.title.trim()) {
        newErrors.title = 'Title is required';
      }
      
      const targetValue = parseFloat(goalData.targetValue);
      if (!goalData.targetValue || isNaN(targetValue) || targetValue <= 0) {
        newErrors.targetValue = 'Target value must be greater than 0';
      }
      
      if (!goalData.endDate) {
        newErrors.endDate = 'End date is required';
      } else if (new Date(goalData.endDate) <= new Date(goalData.startDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        // Validate goal data
        const validatedData = goalSchema.parse({
          type: goalData.type,
          title: goalData.title,
          targetValue: parseFloat(goalData.targetValue),
          unit: goalData.unit,
          startDate: goalData.startDate,
          endDate: goalData.endDate
        });
        
        const { data: newGoal, error } = await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            type: validatedData.type,
            title: validatedData.title,
            target_value: validatedData.targetValue,
            current_value: 0,
            unit: validatedData.unit,
            start_date: validatedData.startDate,
            end_date: validatedData.endDate,
            status: 'active'
          })
          .select()
          .single();
        
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to create goal'
          });
          setIsSubmitting(false);
          return;
        }
        
        if (newGoal) {
          const formattedGoal: Goal = {
            id: newGoal.id,
            userId: newGoal.user_id,
            type: newGoal.type,
            title: newGoal.title,
            targetValue: newGoal.target_value,
            currentValue: newGoal.current_value,
            unit: newGoal.unit,
            startDate: newGoal.start_date,
            endDate: newGoal.end_date,
            status: newGoal.status as 'active' | 'completed' | 'paused',
            createdAt: newGoal.created_at
          };
          
          setGoals([...goals, formattedGoal]);
          
          // Trigger notification
          if (emailNotify) {
            const result = await notifyGoalCreation(
              {
                id: newGoal.id,
                title: validatedData.title,
                type: validatedData.type,
                targetValue: validatedData.targetValue,
                unit: validatedData.unit,
                startDate: validatedData.startDate,
                endDate: validatedData.endDate
              },
              {
                name: user.name,
                email: user.email
              },
              true
            );
            
            sonnerToast.success(
              result.success 
                ? '🎯 Goal created! Check your email for tips.' 
                : '🎯 Goal created successfully!',
              { duration: 4000 }
            );
          } else {
            sonnerToast.success('🎯 Goal created!');
          }
          
          setShowModal(null);
          setGoalData({
            type: 'Distance',
            title: '',
            targetValue: '',
            unit: 'km',
            startDate: new Date().toISOString().split('T')[0],
            endDate: ''
          });
          setErrors({});
        }
      } catch (error: any) {
        if (error.errors) {
          const firstError = error.errors[0];
          sonnerToast.error(firstError.message);
        } else {
          sonnerToast.error('Failed to create goal');
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    const isFormValid = 
      goalData.title.trim() && 
      goalData.targetValue && 
      parseFloat(goalData.targetValue) > 0 && 
      goalData.endDate && 
      new Date(goalData.endDate) > new Date(goalData.startDate);

    return (
      <Modal isOpen={showModal === 'newGoal'} onClose={() => setShowModal(null)} title="Create New Goal">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-soft-graphite mb-2">Goal Type</label>
            <select 
              value={goalData.type} 
              onChange={(e) => setGoalData({...goalData, type: e.target.value})} 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-electric-blue transition-colors [&>option]:bg-deep-charcoal [&>option]:text-foreground"
            >
              <option className="bg-deep-charcoal text-foreground">Distance</option>
              <option className="bg-deep-charcoal text-foreground">Duration</option>
              <option className="bg-deep-charcoal text-foreground">Frequency</option>
              <option className="bg-deep-charcoal text-foreground">Weight</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-soft-graphite mb-2">Goal Title</label>
            <input 
              value={goalData.title} 
              onChange={(e) => {
                setGoalData({...goalData, title: e.target.value});
                if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
              }}
              placeholder="e.g., Run 100km this month" 
              className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-foreground placeholder-soft-graphite focus:outline-none transition-colors ${
                errors.title ? 'border-[#FF4444] focus:border-[#FF4444]' : 'border-white/10 focus:border-electric-blue'
              }`}
            />
            {errors.title && (
              <p className="text-[#FF4444] text-xs mt-1">⚠️ {errors.title}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-soft-graphite mb-2">Target Value</label>
              <input 
                type="number" 
                min="0.01"
                step="0.01"
                value={goalData.targetValue} 
                onChange={(e) => {
                  setGoalData({...goalData, targetValue: e.target.value});
                  if (errors.targetValue) setErrors(prev => ({ ...prev, targetValue: '' }));
                }}
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-foreground focus:outline-none transition-colors ${
                  errors.targetValue ? 'border-[#FF4444] focus:border-[#FF4444]' : 'border-white/10 focus:border-electric-blue'
                }`}
              />
              {errors.targetValue && (
                <p className="text-[#FF4444] text-xs mt-1">⚠️ {errors.targetValue}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-soft-graphite mb-2">Unit</label>
              <select 
                value={goalData.unit} 
                onChange={(e) => setGoalData({...goalData, unit: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-electric-blue transition-colors [&>option]:bg-deep-charcoal [&>option]:text-foreground cursor-pointer"
              >
                {unitOptions[goalData.type]?.map(unit => (
                  <option key={unit} value={unit} className="bg-deep-charcoal text-foreground">
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-soft-graphite mb-2">Start Date</label>
              <input 
                type="date" 
                value={goalData.startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setGoalData({...goalData, startDate: e.target.value})}
                className="w-full bg-[#121212] border border-[#A9A9A9] rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/10 transition-colors [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
              />
            </div>
            <div>
              <label className="block text-sm text-soft-graphite mb-2">End Date</label>
              <input 
                type="date" 
                value={goalData.endDate}
                min={goalData.startDate ? new Date(new Date(goalData.startDate).getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setGoalData({...goalData, endDate: e.target.value});
                  if (errors.endDate) setErrors(prev => ({ ...prev, endDate: '' }));
                }}
                className={`w-full bg-[#121212] border rounded-xl px-4 py-3 text-foreground focus:outline-none transition-colors [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                  errors.endDate ? 'border-[#FF4444] focus:border-[#FF4444]' : 'border-[#A9A9A9] focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/10'
                }`}
              />
              {errors.endDate && (
                <p className="text-[#FF4444] text-xs mt-1">⚠️ {errors.endDate}</p>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <label className="flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all"
                   style={{
                     background: 'rgba(18, 18, 18, 0.5)',
                     border: '1px solid rgba(169, 169, 169, 0.2)'
                   }}>
              <input
                type="checkbox"
                checked={emailNotify}
                onChange={(e) => setEmailNotify(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded focus:ring-2"
                style={{ accentColor: '#FFC857' }}
              />
              <div className="flex-1">
                <span className="text-white font-semibold text-sm">
                  📧 Send me motivational emails
                </span>
                <p className="text-xs mt-1" style={{ color: '#A9A9A9' }}>
                  Get AI-powered personalized tips when you create this goal
                </p>
              </div>
            </label>
          </div>
          
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            className="w-full justify-center"
            style={{
              background: (isSubmitting || !isFormValid) ? '#A9A9A9' : '#FFC857',
              color: '#121212',
              cursor: (isSubmitting || !isFormValid) ? 'not-allowed' : 'pointer',
              opacity: (isSubmitting || !isFormValid) ? 0.5 : 1
            }}
          >
            {isSubmitting ? '⏳ Creating Goal...' : '🎯 Create Goal'}
          </Button>
        </div>
      </Modal>
    );
  };

  const GoalDetailModal = () => {
    if (!selectedGoal) return null;
    
    const goalActivities = activities.filter(a => a.goalId === selectedGoal.id);
    const progress = calculateProgress(selectedGoal.currentValue, selectedGoal.targetValue);

    return (
      <Modal 
        isOpen={showModal === 'goalDetail'} 
        onClose={() => {
          setShowModal(null);
          setSelectedGoal(null);
        }} 
        title={selectedGoal.title}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <ProgressRing progress={progress} size={120} />
            <div className="text-right">
              <div className="text-4xl font-stats font-bold text-foreground mb-1">
                {selectedGoal.currentValue}
              </div>
              <div className="text-soft-graphite">of {selectedGoal.targetValue} {selectedGoal.unit}</div>
              <Badge variant="secondary" className="mt-2 bg-electric-blue/20 text-electric-blue border-electric-blue/30">
                {selectedGoal.type}
              </Badge>
            </div>
          </div>
          
          <ProgressBar progress={progress} />
          
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowModal('logActivity')}
              className="flex-1 justify-center gap-2 bg-auro-gold text-deep-charcoal hover:bg-auro-gold/90"
            >
              <Plus size={20} />
              Log Activity
            </Button>
            <Button 
              variant="ghost" 
              className="px-4"
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from('goals')
                    .delete()
                    .eq('id', selectedGoal.id);
                  
                  if (error) {
                    toast({
                      variant: 'destructive',
                      title: 'Error',
                      description: 'Failed to delete goal'
                    });
                    return;
                  }
                  
                  setGoals(goals.filter(g => g.id !== selectedGoal.id));
                  setShowModal(null);
                  setSelectedGoal(null);
                  
                  toast({
                    title: 'Success',
                    description: 'Goal deleted successfully'
                  });
                } catch (error) {
                  toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to delete goal'
                  });
                }
              }}
            >
              <Trash2 size={20} />
            </Button>
          </div>
          
          <div>
            <h3 className="text-lg font-heading font-bold text-foreground mb-4">Recent Activities</h3>
            {goalActivities.length === 0 ? (
              <div className="text-center py-8 text-soft-graphite">
                <Activity className="mx-auto mb-2" size={32} />
                <p>No activities logged yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {goalActivities.slice(-5).reverse().map(activity => (
                  <div key={activity.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-foreground font-bold">{activity.value} {selectedGoal.unit}</div>
                      <div className="text-sm text-soft-graphite">{formatDate(activity.date)}</div>
                    </div>
                    {activity.notes && (
                      <div className="text-sm text-soft-graphite max-w-xs truncate">{activity.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    );
  };

  const LogActivityModal = () => {
    const [activityData, setActivityData] = useState({
      date: new Date().toISOString().split('T')[0],
      value: '',
      notes: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async () => {
      if (!selectedGoal || !user) return;
      
      // Clear previous errors
      setErrors({});
      
      // Client-side validation
      const newErrors: Record<string, string> = {};
      
      const value = parseFloat(activityData.value);
      if (!activityData.value || isNaN(value) || value < 1) {
        newErrors.value = 'Value must be at least 1';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      
      try {
        // Validate activity data
        const validatedData = activitySchema.parse({
          date: activityData.date,
          value: parseFloat(activityData.value),
          notes: activityData.notes || undefined
        });
        
        // Insert activity
        const { data: newActivity, error: activityError } = await supabase
          .from('activities')
          .insert({
            goal_id: selectedGoal.id,
            user_id: user.id,
            date: validatedData.date,
            value: validatedData.value,
            notes: validatedData.notes || null
          })
          .select()
          .single();
        
        if (activityError) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to log activity'
          });
          return;
        }
        
        // Update goal current_value
        const newCurrentValue = selectedGoal.currentValue + validatedData.value;
        const { error: updateError } = await supabase
          .from('goals')
          .update({ current_value: newCurrentValue })
          .eq('id', selectedGoal.id);
        
        if (updateError) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update goal'
          });
          return;
        }
        
        if (newActivity) {
          const formattedActivity: ActivityLog = {
            id: newActivity.id,
            goalId: newActivity.goal_id,
            userId: newActivity.user_id,
            date: newActivity.date,
            value: newActivity.value,
            notes: newActivity.notes
          };
          
          setActivities([...activities, formattedActivity]);
          
          // Update local goals state
          const updatedGoals = goals.map(g => {
            if (g.id === selectedGoal.id) {
              return { ...g, currentValue: newCurrentValue };
            }
            return g;
          });
          setGoals(updatedGoals);
          
          // Update selectedGoal for the modal
          setSelectedGoal({ ...selectedGoal, currentValue: newCurrentValue });
          
          setShowModal('goalDetail');
          setActivityData({ date: new Date().toISOString().split('T')[0], value: '', notes: '' });
          setErrors({});
          
          toast({
            title: 'Success',
            description: 'Activity logged successfully!'
          });
        }
      } catch (error: any) {
        if (error.errors) {
          const firstError = error.errors[0];
          toast({
            variant: 'destructive',
            title: 'Validation error',
            description: firstError.message
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to log activity'
          });
        }
      }
    };

    const isFormValid = activityData.value && parseFloat(activityData.value) >= 1;

    return (
      <Modal isOpen={showModal === 'logActivity'} onClose={() => setShowModal('goalDetail')} title="Log Activity">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-soft-graphite mb-2">Date</label>
            <input 
              type="date" 
              value={activityData.date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setActivityData({...activityData, date: e.target.value})}
              className="w-full bg-[#121212] border border-[#A9A9A9] rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/10 transition-colors [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
            />
          </div>
          
          <div>
            <label className="block text-sm text-soft-graphite mb-2">Value ({selectedGoal?.unit})</label>
            <input 
              type="number" 
              min="1"
              step="0.1"
              value={activityData.value} 
              onChange={(e) => {
                const value = Math.max(1, parseFloat(e.target.value) || 0);
                setActivityData({...activityData, value: value.toString()});
                if (errors.value) setErrors(prev => ({ ...prev, value: '' }));
              }}
              placeholder={`Enter ${selectedGoal?.unit}`} 
              className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-foreground placeholder-soft-graphite focus:outline-none transition-colors ${
                errors.value ? 'border-[#FF4444] focus:border-[#FF4444]' : 'border-white/10 focus:border-electric-blue'
              }`}
            />
            {errors.value && (
              <p className="text-[#FF4444] text-xs mt-1">⚠️ {errors.value}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm text-soft-graphite mb-2">Notes (optional)</label>
            <textarea 
              value={activityData.notes} 
              onChange={(e) => setActivityData({...activityData, notes: e.target.value})} 
              placeholder="How did it go?" 
              rows={3} 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-soft-graphite focus:outline-none focus:border-electric-blue transition-colors resize-none" 
            />
          </div>
          
          <Button 
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="w-full justify-center"
            style={{
              background: !isFormValid ? '#A9A9A9' : '#FFC857',
              color: '#121212',
              cursor: !isFormValid ? 'not-allowed' : 'pointer',
              opacity: !isFormValid ? 0.5 : 1
            }}
          >
            Save Activity
          </Button>
        </div>
      </Modal>
    );
  };

  const NavBar = () => {
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleSignOut = async () => {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to sign out'
        });
        return;
      }
      
      // Clean up local state
      setUser(null);
      setGoals([]);
      setActivities([]);
      setCurrentView('landing');
      setShowUserMenu(false);
      
      toast({
        title: 'Success',
        description: 'Signed out successfully'
      });
    };

    return (
      <nav className="fixed top-0 w-full bg-deep-charcoal/80 backdrop-blur-lg border-b border-white/10 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Logo size="medium" className="drop-shadow-[0_0_20px_rgba(255,200,87,0.5)] hover:opacity-80 transition-opacity cursor-pointer" />
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setCurrentView('dashboard')} 
              className={`font-heading font-semibold transition-colors ${
                currentView === 'dashboard' ? 'text-foreground' : 'text-soft-graphite hover:text-foreground'
              }`}
            >
              Dashboard
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)} 
                className="flex items-center gap-2 text-soft-graphite hover:text-foreground transition-colors"
              >
                <User size={24} />
                <span className="text-sm font-body hidden md:block">{user?.name}</span>
              </button>
              
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <GlassCard className="absolute right-0 mt-2 w-56 p-3 z-50">
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10">
                      <div className="w-10 h-10 rounded-full bg-auro-gold/20 flex items-center justify-center">
                        <User size={20} className="text-auro-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-heading font-bold text-foreground truncate">
                          {user?.name}
                        </div>
                        <div className="text-xs text-soft-graphite truncate">
                          {user?.email}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-soft-graphite hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <LogIn size={16} className="rotate-180" />
                      Sign Out
                    </button>
                  </GlassCard>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  };

  // Render
  if (!user) {
    if (currentView === 'login') return <AuthForm type="login" />;
    if (currentView === 'signup') return <AuthForm type="signup" />;
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-deep-charcoal flex flex-col">
      <NavBar />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 w-full">
        <Dashboard />
      </div>
      
      <footer className="border-t border-white/10 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="small" />
            <span className="text-soft-graphite text-sm">© {new Date().getFullYear()} AuraQ. All rights reserved.</span>
          </div>
        </div>
      </footer>
      
      <CreateGoalModal />
      {selectedGoal && <GoalDetailModal />}
      {showModal === 'logActivity' && <LogActivityModal />}
    </div>
  );
}
