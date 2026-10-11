import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ServiceConnector } from './service-connector.interface';

@Injectable()
export class WeatherConnector implements ServiceConnector {
  readonly serviceName = 'weather';
  private readonly forecastUrl = 'https://api.open-meteo.com/v1/forecast';
  private readonly geocodingUrl = 'https://geocoding-api.open-meteo.com/v1/search';

  async fetchData(_userId: number, widgetName: string, configuration: Record<string, unknown>): Promise<unknown> {
    if (widgetName === 'search_cities') return this.searchCities(configuration.name, configuration.count);

    const latitude = this.coordinate(configuration.latitude, 'latitude');
    const longitude = this.coordinate(configuration.longitude, 'longitude');
    const unit = configuration.unit === 'imperial' ? 'imperial' : 'metric';

    if (widgetName === 'current_weather') {
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
        temperature_unit: unit === 'imperial' ? 'fahrenheit' : 'celsius',
        wind_speed_unit: unit === 'imperial' ? 'mph' : 'kmh',
      });
      return this.fetchJson(`${this.forecastUrl}?${params}`, 'Weather request failed');
    }

    if (widgetName === 'rain_probability') {
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        daily: 'precipitation_probability_max',
        forecast_days: '7',
        timezone: 'auto',
      });
      const response = await this.fetchJson(`${this.forecastUrl}?${params}`, 'Rain probability request failed') as { daily?: { time?: string[]; precipitation_probability_max?: number[] } };
      return (response.daily?.time ?? []).map((date, index) => ({
        date,
        probability: response.daily?.precipitation_probability_max?.[index] ?? null,
      }));
    }

    throw new ServiceUnavailableException('Unknown weather widget');
  }

  private async searchCities(value: unknown, countValue: unknown): Promise<unknown> {
    if (typeof value !== 'string' || value.trim().length < 2) {
      throw new ServiceUnavailableException('City name must contain at least two characters');
    }

    const requestedCount = Number(countValue ?? 8);
    const count = Number.isFinite(requestedCount) ? Math.min(Math.max(requestedCount, 1), 10) : 8;
    const params = new URLSearchParams({ name: value.trim(), count: String(count), language: 'fr', format: 'json' });
    return this.fetchJson(`${this.geocodingUrl}?${params}`, 'City search failed');
  }

  private async fetchJson(url: string, errorMessage: string): Promise<unknown> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (response.ok) return response.json();
        lastError = new Error(`Provider returned HTTP ${response.status}`);
      } catch (error) {
        lastError = error;
      }

      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }

    console.error(errorMessage, lastError);
    throw new ServiceUnavailableException(`${errorMessage}. Please try again shortly.`);
  }

  private coordinate(value: unknown, name: string): number {
    const coordinate = Number(value);
    const invalidLatitude = name === 'latitude' && (coordinate < -90 || coordinate > 90);
    const invalidLongitude = name === 'longitude' && (coordinate < -180 || coordinate > 180);

    if (!Number.isFinite(coordinate) || invalidLatitude || invalidLongitude) {
      throw new ServiceUnavailableException(`${name} is invalid`);
    }

    return coordinate;
  }
}
