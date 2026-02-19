import { HealthData } from '../types';

export interface DetailedHealthMetrics {
  steps: {
    current: number;
    goal: number;
    progress: number;
    trend: 'up' | 'down' | 'stable';
  };
  heartRate: {
    current: number;
    resting: number;
    variability: number;
    zone: 'rest' | 'fat-burn' | 'cardio' | 'peak';
  };
  sleep: {
    duration: number;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    deepSleep: number;
    remSleep: number;
    score: number;
  };
  calories: {
    burned: number;
    consumed: number;
    net: number;
    goal: number;
  };
  activity: {
    activeMinutes: number;
    sedentaryMinutes: number;
    workouts: number;
    goal: number;
  };
  hydration: {
    glasses: number;
    goal: number;
    reminder: boolean;
  };
}

export interface HealthInsight {
  type: 'achievement' | 'warning' | 'tip' | 'trend';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

class HealthMonitoringService {
  private healthHistory: Map<string, DetailedHealthMetrics[]> = new Map();
  private goals: Map<string, Partial<DetailedHealthMetrics>> = new Map();

  constructor() {
    this.setDefaultGoals();
  }

  private setDefaultGoals() {
    this.goals.set('default', {
      steps: { current: 0, goal: 10000, progress: 0, trend: 'stable' },
      calories: { burned: 0, consumed: 0, net: 0, goal: 2000 },
      activity: { activeMinutes: 0, sedentaryMinutes: 0, workouts: 0, goal: 60 },
      hydration: { glasses: 0, goal: 8, reminder: false }
    });
  }

  getDetailedMetrics(userId: string = 'default'): DetailedHealthMetrics {
    const goals = this.goals.get(userId) || this.goals.get('default')!;

    const now = new Date();
    const hour = now.getHours();

    const steps = Math.floor(Math.random() * 5000) + 5000;
    const stepsGoal = (goals.steps?.goal || 10000);

    const heartRate = hour < 8 ? 58 + Math.floor(Math.random() * 10) : 70 + Math.floor(Math.random() * 20);

    const sleepDuration = 6 + Math.random() * 3;
    const deepSleep = sleepDuration * 0.2;
    const remSleep = sleepDuration * 0.25;

    const burned = 1800 + Math.floor(Math.random() * 500);
    const consumed = 1600 + Math.floor(Math.random() * 600);

    const activeMinutes = Math.floor(Math.random() * 90);

    return {
      steps: {
        current: steps,
        goal: stepsGoal,
        progress: Math.round((steps / stepsGoal) * 100),
        trend: this.calculateTrend('steps', steps)
      },
      heartRate: {
        current: heartRate,
        resting: 62 + Math.floor(Math.random() * 8),
        variability: 35 + Math.floor(Math.random() * 20),
        zone: this.getHeartRateZone(heartRate)
      },
      sleep: {
        duration: Math.round(sleepDuration * 10) / 10,
        quality: this.getSleepQuality(sleepDuration),
        deepSleep: Math.round(deepSleep * 10) / 10,
        remSleep: Math.round(remSleep * 10) / 10,
        score: Math.floor(60 + Math.random() * 35)
      },
      calories: {
        burned,
        consumed,
        net: burned - consumed,
        goal: goals.calories?.goal || 2000
      },
      activity: {
        activeMinutes,
        sedentaryMinutes: Math.max(0, 16 * 60 - activeMinutes),
        workouts: Math.floor(Math.random() * 3),
        goal: goals.activity?.goal || 60
      },
      hydration: {
        glasses: Math.floor(Math.random() * 10) + 4,
        goal: goals.hydration?.goal || 8,
        reminder: Math.random() > 0.7
      }
    };
  }

  private calculateTrend(metric: string, currentValue: number): 'up' | 'down' | 'stable' {
    const history = this.healthHistory.get(metric) || [];
    if (history.length < 3) return 'stable';

    const recent = history.slice(-3).map(h => (h as any)[metric]?.current || 0);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;

    const changePercent = ((currentValue - avg) / avg) * 100;

    if (changePercent > 10) return 'up';
    if (changePercent < -10) return 'down';
    return 'stable';
  }

  private getHeartRateZone(hr: number): 'rest' | 'fat-burn' | 'cardio' | 'peak' {
    if (hr < 70) return 'rest';
    if (hr < 100) return 'fat-burn';
    if (hr < 140) return 'cardio';
    return 'peak';
  }

  private getSleepQuality(duration: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (duration < 5) return 'poor';
    if (duration < 6) return 'fair';
    if (duration < 8) return 'good';
    return 'excellent';
  }

  getHealthInsights(userId: string = 'default'): HealthInsight[] {
    const metrics = this.getDetailedMetrics(userId);
    const insights: HealthInsight[] = [];

    if (metrics.steps.progress >= 100) {
      insights.push({
        type: 'achievement',
        title: '🎉 Step Goal Achieved!',
        message: `You've reached ${metrics.steps.current.toLocaleString()} steps today!`,
        priority: 'high'
      });
    } else if (metrics.steps.progress >= 75) {
      insights.push({
        type: 'tip',
        title: '💪 Almost There',
        message: `${metrics.steps.goal - metrics.steps.current} more steps to reach your goal!`,
        priority: 'medium'
      });
    }

    if (metrics.heartRate.zone === 'rest' && metrics.heartRate.variability > 50) {
      insights.push({
        type: 'achievement',
        title: '❤️ Great Recovery',
        message: 'Your heart rate variability indicates good recovery.',
        priority: 'medium'
      });
    }

    if (metrics.sleep.quality === 'poor') {
      insights.push({
        type: 'warning',
        title: '😴 Poor Sleep Detected',
        message: 'Your sleep duration was low last night. Aim for 7-9 hours.',
        priority: 'high'
      });
    } else if (metrics.sleep.quality === 'excellent') {
      insights.push({
        type: 'achievement',
        title: '🌟 Excellent Sleep',
        message: `You slept ${metrics.sleep.duration} hours with good quality!`,
        priority: 'medium'
      });
    }

    if (metrics.activity.activeMinutes < 30) {
      insights.push({
        type: 'tip',
        title: '🏃 Get Moving',
        message: 'Only 30 minutes of activity recommended today.',
        priority: 'medium'
      });
    }

    if (metrics.hydration.reminder && metrics.hydration.glasses < metrics.hydration.goal) {
      insights.push({
        type: 'tip',
        title: '💧 Stay Hydrated',
        message: `Drink ${metrics.hydration.goal - metrics.hydration.glasses} more glasses of water.`,
        priority: 'low'
      });
    }

    if (metrics.calories.burned > metrics.calories.consumed + 500) {
      insights.push({
        type: 'achievement',
        title: '🔥 Great Deficit',
        message: 'You have a healthy calorie deficit today!',
        priority: 'medium'
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  getWellnessScore(userId: string = 'default'): number {
    const metrics = this.getDetailedMetrics(userId);

    const stepScore = Math.min(100, metrics.steps.progress);
    const sleepScore = metrics.sleep.score;
    const activityScore = Math.min(100, (metrics.activity.activeMinutes / metrics.activity.goal) * 100);
    const hrScore = metrics.heartRate.zone === 'rest' ? 100 : metrics.heartRate.zone === 'fat-burn' ? 80 : 60;

    return Math.round((stepScore * 0.25 + sleepScore * 0.35 + activityScore * 0.25 + hrScore * 0.15));
  }

  setGoals(userId: string, newGoals: Partial<DetailedHealthMetrics>) {
    this.goals.set(userId, newGoals);
  }

  generateDailyPlan(userId: string = 'default'): { morning: string; afternoon: string; evening: string } {
    const metrics = this.getDetailedMetrics(userId);
    const plan = {
      morning: 'Start with a glass of water and light stretching',
      afternoon: 'Take a 15-minute walk after lunch',
      evening: 'Wind down with meditation or reading'
    };

    if (metrics.steps.progress < 50) {
      plan.afternoon += '. Consider a longer walk to boost steps.';
    }

    if (metrics.sleep.quality === 'poor') {
      plan.evening += ' Focus on getting to bed earlier.';
    }

    if (metrics.hydration.glasses < metrics.hydration.goal) {
      plan.morning += ` Drink ${metrics.hydration.goal - metrics.hydration.glasses} more glasses today.`;
    }

    return plan;
  }
}

export const healthMonitoringService = new HealthMonitoringService();
