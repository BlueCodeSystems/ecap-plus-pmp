/**
 * Backend Data Models
 * Inferred from loose naming in frontend components and backend SQL queries.
 */

export interface BackendHousehold {
  household_id: string; // or hh_id, id, unique_id
  screened?: string | boolean; // or is_screened, screening_status
  facility?: string; // or facility_name, health_facility
  caseworker_name?: string; // or caseworkerName, caseworker
  caseworker_household_count?: number | string; // or caseworker_count
  last_service_date?: string; // or last_visit_date, service_date
  last_edited?: string; // or updated_at
  [key: string]: unknown; // Allow loose typing for now
}

export interface BackendVCA {
  vca_id: string; // or vcaid, id, unique_id, child_id
  screened?: string | boolean;
  facility?: string;
  birth_date?: string; // or dob, date_of_birth
  gender?: string; // or sex
  last_service_date?: string;
  virally_suppressed?: string | boolean; // or viral_suppressed, suppressed
  last_edited?: string;
  [key: string]: unknown;
}

export interface BackendService {
  household_id?: string;
  service?: string; // or service_name, form_name
  service_date?: string; // or visit_date, created_at, date
  status?: string; // or state, outcome
  [key: string]: unknown;
}
