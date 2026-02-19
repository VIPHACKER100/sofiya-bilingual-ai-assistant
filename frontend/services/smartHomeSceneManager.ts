import { SmartDevice } from '../types';

export interface SmartHomeScene {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  icon: string;
  actions: SceneDeviceAction[];
  gradient: string;
}

export interface SceneDeviceAction {
  deviceType: 'light' | 'thermostat' | 'lock' | 'fan';
  property: string;
  value: any;
  transitionDuration?: number;
}

class SmartHomeSceneManager {
  private scenes: SmartHomeScene[] = [
    {
      id: 'movie-night',
      name: 'Movie Night',
      nameHi: 'मूवी नाइट',
      description: 'Dim lights, close blinds, optimize for entertainment',
      icon: '🎬',
      gradient: 'from-purple-900/50 to-black',
      actions: [
        { deviceType: 'light', property: 'brightness', value: 10, transitionDuration: 2000 },
        { deviceType: 'thermostat', property: 'temperature', value: 21 }
      ]
    },
    {
      id: 'good-morning',
      name: 'Good Morning',
      nameHi: 'सुप्रभात',
      description: 'Gradual lights, open blinds, pleasant temperature',
      icon: '🌅',
      gradient: 'from-amber-900/50 to-black',
      actions: [
        { deviceType: 'light', property: 'brightness', value: 80, transitionDuration: 3000 },
        { deviceType: 'light', property: 'colorTemp', value: 3500 },
        { deviceType: 'thermostat', property: 'temperature', value: 22 }
      ]
    },
    {
      id: 'focus-work',
      name: 'Focus Work',
      nameHi: 'फोकस मोड',
      description: 'Bright, cool lighting, quiet environment',
      icon: '💼',
      gradient: 'from-cyan-900/50 to-black',
      actions: [
        { deviceType: 'light', property: 'brightness', value: 100 },
        { deviceType: 'light', property: 'colorTemp', value: 5000 },
        { deviceType: 'thermostat', property: 'temperature', value: 20 }
      ]
    },
    {
      id: 'bedtime',
      name: 'Bedtime',
      nameHi: 'सोने का समय',
      description: 'Dim warm lights, cool temperature for sleep',
      icon: '🌙',
      gradient: 'from-indigo-900/50 to-black',
      actions: [
        { deviceType: 'light', property: 'brightness', value: 5 },
        { deviceType: 'light', property: 'colorTemp', value: 2200 },
        { deviceType: 'thermostat', property: 'temperature', value: 18 },
        { deviceType: 'lock', property: 'locked', value: true }
      ]
    },
    {
      id: 'party-mode',
      name: 'Party Mode',
      nameHi: 'पार्टी मोड',
      description: 'Colorful lights, upbeat environment',
      icon: '🎉',
      gradient: 'from-pink-900/50 to-black',
      actions: [
        { deviceType: 'light', property: 'brightness', value: 100 },
        { deviceType: 'light', property: 'color', value: '#ff00ff' },
        { deviceType: 'thermostat', property: 'temperature', value: 19 }
      ]
    },
    {
      id: 'relax',
      name: 'Relax Mode',
      nameHi: 'आराम',
      description: 'Soft warm lighting, comfortable temperature',
      icon: '🧘',
      gradient: 'from-emerald-900/50 to-black',
      actions: [
        { deviceType: 'light', property: 'brightness', value: 30 },
        { deviceType: 'light', property: 'colorTemp', value: 2700 },
        { deviceType: 'thermostat', property: 'temperature', value: 23 }
      ]
    },
    {
      id: 'away',
      name: 'Away Mode',
      nameHi: 'घर से बाहर',
      description: 'Lights off, security locked, eco temperature',
      icon: '🔒',
      gradient: 'from-slate-900/50 to-black',
      actions: [
        { deviceType: 'light', property: 'brightness', value: 0 },
        { deviceType: 'thermostat', property: 'temperature', value: 16 },
        { deviceType: 'lock', property: 'locked', value: true }
      ]
    },
    {
      id: 'arriving-home',
      name: 'Arriving Home',
      nameHi: 'घर आ रहे हो',
      description: 'Welcome lights, comfortable temperature',
      icon: '🏠',
      gradient: 'from-orange-900/50 to-black',
      actions: [
        { deviceType: 'light', property: 'brightness', value: 60 },
        { deviceType: 'light', property: 'colorTemp', value: 3000 },
        { deviceType: 'thermostat', property: 'temperature', value: 22 },
        { deviceType: 'lock', property: 'locked', value: false }
      ]
    }
  ];

  getAllScenes(): SmartHomeScene[] {
    return this.scenes;
  }

  getSceneById(id: string): SmartHomeScene | undefined {
    return this.scenes.find(s => s.id === id);
  }

  getSceneByName(name: string, language: 'en' | 'hi' = 'en'): SmartHomeScene | undefined {
    const lower = name.toLowerCase();
    return this.scenes.find(s => {
      if (language === 'hi') {
        return s.nameHi.toLowerCase().includes(lower);
      }
      return s.name.toLowerCase().includes(lower) || s.id.toLowerCase().includes(lower);
    });
  }

  applyScene(devices: SmartDevice[], scene: SmartHomeScene): SmartDevice[] {
    const updatedDevices = [...devices];

    for (const action of scene.actions) {
      const deviceIndex = updatedDevices.findIndex(d => d.type === action.deviceType);
      if (deviceIndex !== -1) {
        const device = { ...updatedDevices[deviceIndex] };

        switch (action.property) {
          case 'brightness':
          case 'brightness':
            device.status = action.value;
            break;
          case 'temperature':
          case 'temperature':
            device.status = `${action.value}°C`;
            break;
          case 'locked':
            device.status = action.value ? 'Locked' : 'Unlocked';
            break;
          case 'color':
          case 'colorTemp':
            device.status = action.value;
            break;
        }

        updatedDevices[deviceIndex] = device;
      }
    }

    return updatedDevices;
  }

  createCustomScene(
    name: string,
    nameHi: string,
    actions: SceneDeviceAction[]
  ): SmartHomeScene {
    const newScene: SmartHomeScene = {
      id: `custom-${Date.now()}`,
      name,
      nameHi,
      description: `Custom scene: ${name}`,
      icon: '⚡',
      gradient: 'from-violet-900/50 to-black',
      actions
    };

    this.scenes.push(newScene);
    return newScene;
  }

  optimizeForTimeOfDay(scene: SmartHomeScene): SmartHomeScene {
    const hour = new Date().getHours();
    const optimized = { ...scene, actions: [...scene.actions] };

    if (hour >= 6 && hour < 12) {
      optimized.actions = optimized.actions.map(action => {
        if (action.deviceType === 'light' && action.property === 'brightness') {
          return { ...action, value: Math.max(action.value as number, 70) };
        }
        return action;
      });
    } else if (hour >= 18 && hour < 22) {
      optimized.actions = optimized.actions.map(action => {
        if (action.deviceType === 'light' && action.property === 'colorTemp') {
          return { ...action, value: 2700 };
        }
        return action;
      });
    }

    return optimized;
  }
}

export const smartHomeSceneManager = new SmartHomeSceneManager();
