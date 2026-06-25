import { Cliente } from "./users";
import { Cita } from "./appointments";
import { OrdenCompra } from "./commerce";
import { Notificacion } from "./management";
import { Servicio, ImagenGaleria } from "./catalog";

export interface DashboardStats {
  citasHoy: number;
  totalClientes: number;
  productosActivos: number;
  totalOrdenes: number;
}

export interface DashboardData {
  stats: DashboardStats;
  notificaciones: Notificacion[];
}
