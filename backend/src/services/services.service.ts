import { Injectable } from '@nestjs/common';
import { ServiceConnector } from './connectors/service-connector.interface';
import { GitHubConnector } from './connectors/github.connector';
import { WeatherConnector } from './connectors/weather.connector';

@Injectable()
export class ServicesService {
  private readonly connectors = new Map<string, ServiceConnector>();

  constructor(githubConnector: GitHubConnector, weatherConnector: WeatherConnector) {
    this.registerConnector(githubConnector);
    this.registerConnector(weatherConnector);
  }

  registerConnector(connector: ServiceConnector): void {
    this.connectors.set(connector.serviceName, connector);
  }

  getConnector(serviceName: string): ServiceConnector | undefined {
    return this.connectors.get(serviceName);
  }
}
