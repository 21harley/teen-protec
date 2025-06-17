export interface AlarmaData {
  id:number,
  id_usuario?: number;
  mensaje: string;
  vista?: boolean;
  fecha_vista?: Date | null;
  url_destino?: string; 
}