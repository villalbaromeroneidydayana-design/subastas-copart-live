export type VehicleCondition = 'run_and_drive' | 'starts' | 'stationary' | 'unknown';
export type TitleType = 'clean' | 'salvage' | 'rebuilt' | 'certificate_of_destruction' | 'non_repairable' | 'parts_only';
export type PhotoCategory = 'exterior' | 'interior' | 'motor' | 'tablero' | 'danos';
export type AuctionStatus = 'prepared' | 'open' | 'started' | 'bidding' | 'last_call' | 'paused' | 'closed' | 'sold' | 'unsold';
export type SimulationOutcome = 'win' | 'lose';

export interface VehicleImage {
  id: string;
  vehicle_id: string;
  url: string;
  category: PhotoCategory;
  is_primary: boolean;
  order: number;
  caption?: string;
}

export interface CustomBadgeItem {
  id: string;
  label: string;
  action: 'engine_sound' | '360_view' | 'carfax' | 'custom_modal' | 'none';
  color?: 'amber' | 'blue' | 'emerald' | 'purple' | 'slate';
  modalTitle?: string;
  modalContent?: string;
}

export interface CustomVehicleBadges {
  engineSoundEnabled?: boolean;
  engineSoundText?: string;
  threeSixtyEnabled?: boolean;
  threeSixtyText?: string;
  carfaxEnabled?: boolean;
  carfaxText?: string;
  carfaxAccidents?: string;
  carfaxOwners?: string;
  carfaxServiceRecords?: string;
  carfaxTitleStatus?: string;
  carfaxVerifiedNotes?: string;
  runDriveText?: string;
  titleTypeText?: string;
  extraBadges?: CustomBadgeItem[];
  auctioneerWelcomeChant?: string;
  auctioneerVoiceGender?: 'male';
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  version?: string;
  vin: string;
  lot_number: string;
  reference_url?: string;
  
  // Características
  engine?: string;
  displacement?: string;
  transmission?: string;
  drivetrain?: string; // AWD, FWD, RWD, 4x4
  fuel?: string;
  odometer: number;
  odometer_unit: 'mi' | 'km';
  exterior_color?: string;
  interior_color?: string;

  // Condiciones
  title_type: TitleType;
  vehicle_condition: VehicleCondition;
  primary_damage?: string;
  secondary_damage?: string;
  auction_reason?: string;
  sale_date?: string;
  has_keys: boolean;
  location?: string;
  equipment?: string[];
  notes?: string;
  est_retail_value?: number;
  custom_badges?: CustomVehicleBadges;

  images: VehicleImage[];
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  registration_date: string;
  notes?: string;
  status: 'nuevo' | 'contactado' | 'negociando' | 'listo_subasta' | 'cerrado';
  created_at: string;
  updated_at: string;
}

export interface VirtualBidder {
  id: string;
  name: string;
  location: string;
  is_client?: boolean;
}

export interface AuctionBid {
  id: string;
  session_id: string;
  amount: number;
  bidder_id: string;
  bidder_name: string;
  bidder_location: string;
  is_client: boolean;
  timestamp: string;
  sequence_number: number;
}

export interface AuctionSession {
  id: string;
  client_id: string;
  vehicle_id: string;
  title: string;
  status: AuctionStatus;
  
  // Snapshot histórico inmutable
  vehicle_snapshot: Vehicle;
  client_snapshot: Client;

  // Parámetros de simulación
  starting_price: number;
  bid_increment: number;
  expected_final_price: number;
  duration_seconds: number;
  bid_interval_seconds: number;
  total_planned_bids: number;
  virtual_bidders: VirtualBidder[];
  expected_outcome: SimulationOutcome; // win (cliente gana) o lose (cliente superado)
  
  // Estado en tiempo real
  current_price: number;
  current_bidder_id?: string;
  current_bidder_name?: string;
  current_bidder_location?: string;
  is_client_winning: boolean;
  current_bid_count: number;
  time_remaining_seconds: number;
  is_paused: boolean;
  started_at?: string;
  ended_at?: string;

  // Token de acceso seguro y datos de broker/comprador
  room_token: string;
  is_token_revoked: boolean;
  client_max_budget?: number;
  sale_date?: string;
  broker_name?: string;
  buyer_name?: string;
  broker_access_token?: string;
  buyer_access_token?: string;
  broker_token_revoked?: boolean;
  buyer_token_revoked?: boolean;
  links?: {
    auctioneerLink?: string;
    brokerLink?: string;
    buyerLink?: string;
  };

  created_at: string;
  updated_at: string;
}

export interface AuctionResult {
  id: string;
  session_id: string;
  lot_number: string;
  vehicle_summary: string;
  client_name: string;
  client_email: string;
  starting_price: number;
  final_price: number;
  total_bids: number;
  winner_name: string;
  winner_location: string;
  is_client_winner: boolean;
  finished_at: string;
  notes?: string;
}

export interface DashboardMetrics {
  totalClients: number;
  totalVehicles: number;
  preparedAuctions: number;
  activeAuctions: number;
  finishedAuctions: number;
}

