export interface ServiceConnector {
  readonly serviceName: string;
  fetchData(userId: number, widgetName: string, configuration: Record<string, unknown>): Promise<unknown>;
}
