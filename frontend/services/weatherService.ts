
export interface WeatherData {
    temp: number;
    condition: string;
    windSpeed: number;
    locationName?: string;
}

class WeatherService {
    private API_URL = 'https://api.open-meteo.com/v1/forecast';

    async fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
        try {
            const response = await fetch(`${this.API_URL}?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const data = await response.json();

            if (data.current_weather) {
                return {
                    temp: data.current_weather.temperature,
                    condition: this.getWeatherCondition(data.current_weather.weathercode),
                    windSpeed: data.current_weather.windspeed,
                    locationName: "Local Sector"
                };
            }
            return null;
        } catch (error) {
            console.error('Weather Service Error:', error);
            return null;
        }
    }

    private getWeatherCondition(code: number): string {
        const conditions: Record<number, string> = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Rime fog',
            51: 'Light drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            71: 'Slight snow',
            95: 'Thunderstorm'
        };
        return conditions[code] || 'Optimal';
    }
}

export const weatherService = new WeatherService();
