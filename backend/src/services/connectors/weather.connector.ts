import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ServiceConnector } from './service-connector.interface';

@Injectable()
export class WeatherConnector implements ServiceConnector {
  readonly serviceName = 'weather';

  async fetchData(_userId: number, widgetName: string, configuration: Record<string, unknown>): Promise<unknown> {
    if (widgetName === 'search_cities') return this.searchCities(configuration.name, configuration.count);
    if (widgetName !== 'current_weather') throw new ServiceUnavailableException('Unknown weather widget');
    const latitude = this.coordinate(configuration.latitude, 'latitude');
    const longitude = this.coordinate(configuration.longitude, 'longitude');
    const unit = configuration.unit === 'imperial' ? 'imperial' : 'metric';
    const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m', temperature_unit: unit === 'imperial' ? 'fahrenheit' : 'celsius', wind_speed_unit: unit === 'imperial' ? 'mph' : 'kmh' });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new ServiceUnavailableException('Weather API request failed');
    return response.json();
  }

  private async searchCities(value: unknown, countValue: unknown): Promise<unknown> {
    if (typeof value !== 'string' || value.trim().length < 2) throw new ServiceUnavailableException('name must contain at least two characters');
    const count = Math.min(Math.max(Number(countValue ?? 8), 1), 10);
    const params = new URLSearchParams({ name: value.trim(), count: String(count), language: 'fr', format: 'json' });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
    if (!response.ok) throw new ServiceUnavailableException('City search failed');
    return response.json();
  }

  private coordinate(value: unknown, name: string): number {
    const coordinate = Number(value);
    if (!Number.isFinite(coordinate) || (name === 'latitude' && (coordinate < -90 || coordinate > 90)) || (name === 'longitude' && (coordinate < -180 || coordinate > 180))) throw new ServiceUnavailableException(`${name} is invalid`);
    return coordinate;
  }
}
