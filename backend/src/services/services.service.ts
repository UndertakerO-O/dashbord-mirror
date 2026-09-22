import { Injectable } from '@nestjs/common';
import { ServiceConnector } from './connectors/service-connector.interface';

@Injectable()
export class ServicesService {
  private readonly connectors = new Map<string, ServiceConnector>();

  // Enregistre un connecteur pour le rendre disponible aux widgets.
  registerConnector(connector: ServiceConnector): void {
    this.connectors.set(connector.serviceName, connector);
  }

  // Récupère le connecteur correspondant au service demandé.
  getConnector(serviceName: string): ServiceConnector | undefined {
    return this.connectors.get(serviceName);
  }
}
