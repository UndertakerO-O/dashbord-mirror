import { Injectable } from '@nestjs/common';
import { ServiceConnector } from './connectors/service-connector.interface';

@Injectable()
export class ServicesService {
  private readonly connectors = new Map<string, ServiceConnector>();

  registerConnector(connector: ServiceConnector): void {
    this.connectors.set(connector.serviceName, connector);
  }

  getConnector(serviceName: string): ServiceConnector | undefined {
    return this.connectors.get(serviceName);
  }
}
