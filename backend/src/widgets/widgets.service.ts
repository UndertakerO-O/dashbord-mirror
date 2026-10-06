import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicesService } from '../services/services.service';

@Injectable()
export class WidgetsService {
  constructor(private readonly servicesService: ServicesService) {}

  async fetchServiceWidget(userId: number, serviceName: string, widgetName: string, configuration: Record<string, unknown>) {
    const connector = this.servicesService.getConnector(serviceName);
    if (!connector) throw new NotFoundException('Service connector not found');
    return connector.fetchData(userId, widgetName, configuration);
  }
}
