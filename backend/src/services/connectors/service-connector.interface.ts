// Contrat commun pour les connecteurs d’APIs externes.
export interface ServiceConnector {
  readonly serviceName: string;

  fetchData(configuration: Record<string, unknown>): Promise<unknown>;
}
