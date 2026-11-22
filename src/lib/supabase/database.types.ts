
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "approval_stamps": {
                  Row: {
                    "content_hash": string,"created_at": string,"credential_id": string | null,"decision": Database["public"]['Enums']["approval_decision"],"doc_id": string,"doc_type": Database["public"]['Enums']["approval_doc_type"],"id": string,"lat": number | null,"lng": number | null,"method": Database["public"]['Enums']["signature_method"],"note": string | null,"signed_at": string,"signer_id": string,"signer_name": string,"signer_role": Database["public"]['Enums']["app_role"],"subject_user_id": string | null,"user_agent": string | null,"verify_code": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content_hash": string,"created_at"?: string,"credential_id"?: string | null,"decision": Database["public"]['Enums']["approval_decision"],"doc_id": string,"doc_type": Database["public"]['Enums']["approval_doc_type"],"id"?: string,"lat"?: number | null,"lng"?: number | null,"method"?: Database["public"]['Enums']["signature_method"],"note"?: string | null,"signed_at"?: string,"signer_id": string,"signer_name": string,"signer_role": Database["public"]['Enums']["app_role"],"subject_user_id"?: string | null,"user_agent"?: string | null,"verify_code": string
                  }
                  Update: {
                    "content_hash"?: string,"created_at"?: string,"credential_id"?: string | null,"decision"?: Database["public"]['Enums']["approval_decision"],"doc_id"?: string,"doc_type"?: Database["public"]['Enums']["approval_doc_type"],"id"?: string,"lat"?: number | null,"lng"?: number | null,"method"?: Database["public"]['Enums']["signature_method"],"note"?: string | null,"signed_at"?: string,"signer_id"?: string,"signer_name"?: string,"signer_role"?: Database["public"]['Enums']["app_role"],"subject_user_id"?: string | null,"user_agent"?: string | null,"verify_code"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "approval_stamps_signer_id_fkey"
      columns: ["signer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "approval_stamps_subject_user_id_fkey"
      columns: ["subject_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"attendance_exceptions": {
                  Row: {
                    "accuracy_m": number | null,"created_at": string,"decided_at": string | null,"decided_by": string | null,"decision_note": string | null,"id": string,"kind": Database["public"]['Enums']["attendance_kind"],"lat": number,"lng": number,"nearest_distance_m": number | null,"nearest_location_id": string | null,"photo_path": string,"reason": string,"requested_at": string,"status": Database["public"]['Enums']["request_status"],"updated_at": string,"user_id": string,"work_date": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accuracy_m"?: number | null,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"decision_note"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["attendance_kind"],"lat": number,"lng": number,"nearest_distance_m"?: number | null,"nearest_location_id"?: string | null,"photo_path": string,"reason": string,"requested_at"?: string,"status"?: Database["public"]['Enums']["request_status"],"updated_at"?: string,"user_id": string,"work_date": string
                  }
                  Update: {
                    "accuracy_m"?: number | null,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"decision_note"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["attendance_kind"],"lat"?: number,"lng"?: number,"nearest_distance_m"?: number | null,"nearest_location_id"?: string | null,"photo_path"?: string,"reason"?: string,"requested_at"?: string,"status"?: Database["public"]['Enums']["request_status"],"updated_at"?: string,"user_id"?: string,"work_date"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_exceptions_nearest_location_id_fkey"
      columns: ["nearest_location_id"]
isOneToOne: false
      referencedRelation: "work_locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_exceptions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"attendance_records": {
                  Row: {
                    "clock_in_accuracy_m": number | null,"clock_in_at": string,"clock_in_distance_m": number | null,"clock_in_exception_id": string | null,"clock_in_lat": number,"clock_in_lng": number,"clock_in_location_id": string | null,"clock_in_photo_path": string,"clock_out_accuracy_m": number | null,"clock_out_at": string | null,"clock_out_distance_m": number | null,"clock_out_exception_id": string | null,"clock_out_lat": number | null,"clock_out_lng": number | null,"clock_out_location_id": string | null,"clock_out_photo_path": string | null,"created_at": string,"early_minutes": number,"id": string,"late_minutes": number,"updated_at": string,"user_id": string,"work_date": string
                  }
                  ComputedFields: never
                  Insert: {
                    "clock_in_accuracy_m"?: number | null,"clock_in_at": string,"clock_in_distance_m"?: number | null,"clock_in_exception_id"?: string | null,"clock_in_lat": number,"clock_in_lng": number,"clock_in_location_id"?: string | null,"clock_in_photo_path": string,"clock_out_accuracy_m"?: number | null,"clock_out_at"?: string | null,"clock_out_distance_m"?: number | null,"clock_out_exception_id"?: string | null,"clock_out_lat"?: number | null,"clock_out_lng"?: number | null,"clock_out_location_id"?: string | null,"clock_out_photo_path"?: string | null,"created_at"?: string,"early_minutes"?: number,"id"?: string,"late_minutes"?: number,"updated_at"?: string,"user_id": string,"work_date": string
                  }
                  Update: {
                    "clock_in_accuracy_m"?: number | null,"clock_in_at"?: string,"clock_in_distance_m"?: number | null,"clock_in_exception_id"?: string | null,"clock_in_lat"?: number,"clock_in_lng"?: number,"clock_in_location_id"?: string | null,"clock_in_photo_path"?: string,"clock_out_accuracy_m"?: number | null,"clock_out_at"?: string | null,"clock_out_distance_m"?: number | null,"clock_out_exception_id"?: string | null,"clock_out_lat"?: number | null,"clock_out_lng"?: number | null,"clock_out_location_id"?: string | null,"clock_out_photo_path"?: string | null,"created_at"?: string,"early_minutes"?: number,"id"?: string,"late_minutes"?: number,"updated_at"?: string,"user_id"?: string,"work_date"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_records_clock_in_location_id_fkey"
      columns: ["clock_in_location_id"]
isOneToOne: false
      referencedRelation: "work_locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_records_clock_out_location_id_fkey"
      columns: ["clock_out_location_id"]
isOneToOne: false
      referencedRelation: "work_locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_records_in_exception"
      columns: ["clock_in_exception_id"]
isOneToOne: false
      referencedRelation: "attendance_exceptions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_records_out_exception"
      columns: ["clock_out_exception_id"]
isOneToOne: false
      referencedRelation: "attendance_exceptions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_records_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "action": Database["public"]['Enums']["audit_action"],"actor_id": string | null,"at": string,"id": number,"new_data": Json | null,"old_data": Json | null,"row_id": string,"table_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": Database["public"]['Enums']["audit_action"],"actor_id"?: string | null,"at"?: string,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null,"row_id": string,"table_name": string
                  }
                  Update: {
                    "action"?: Database["public"]['Enums']["audit_action"],"actor_id"?: string | null,"at"?: string,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null,"row_id"?: string,"table_name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"banners": {
                  Row: {
                    "alt": string,"content_status": Database["public"]['Enums']["content_status"],"created_at": string,"created_by": string | null,"cta_href": string | null,"cta_label": string | null,"deleted_at": string | null,"ends_at": string | null,"id": string,"image_path": string,"mobile_image_path": string | null,"sort_order": number,"starts_at": string | null,"subtitle": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alt": string,"content_status"?: Database["public"]['Enums']["content_status"],"created_at"?: string,"created_by"?: string | null,"cta_href"?: string | null,"cta_label"?: string | null,"deleted_at"?: string | null,"ends_at"?: string | null,"id"?: string,"image_path": string,"mobile_image_path"?: string | null,"sort_order"?: number,"starts_at"?: string | null,"subtitle"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "alt"?: string,"content_status"?: Database["public"]['Enums']["content_status"],"created_at"?: string,"created_by"?: string | null,"cta_href"?: string | null,"cta_label"?: string | null,"deleted_at"?: string | null,"ends_at"?: string | null,"id"?: string,"image_path"?: string,"mobile_image_path"?: string | null,"sort_order"?: number,"starts_at"?: string | null,"subtitle"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"careers": {
                  Row: {
                    "closes_on": string | null,"content_status": Database["public"]['Enums']["content_status"],"created_at": string,"created_by": string | null,"deleted_at": string | null,"department": string | null,"description": NonNullable<Json>,"employment_type": string | null,"id": string,"level": Database["public"]['Enums']["career_level"] | null,"location": string | null,"requirements": NonNullable<Json>,"slug": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "closes_on"?: string | null,"content_status"?: Database["public"]['Enums']["content_status"],"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"department"?: string | null,"description"?: NonNullable<Json>,"employment_type"?: string | null,"id"?: string,"level"?: Database["public"]['Enums']["career_level"] | null,"location"?: string | null,"requirements"?: NonNullable<Json>,"slug": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "closes_on"?: string | null,"content_status"?: Database["public"]['Enums']["content_status"],"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"department"?: string | null,"description"?: NonNullable<Json>,"employment_type"?: string | null,"id"?: string,"level"?: Database["public"]['Enums']["career_level"] | null,"location"?: string | null,"requirements"?: NonNullable<Json>,"slug"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"chat_messages": {
                  Row: {
                    "content": string,"created_at": string,"id": string,"input_tokens": number | null,"output_tokens": number | null,"role": string,"session_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content": string,"created_at"?: string,"id"?: string,"input_tokens"?: number | null,"output_tokens"?: number | null,"role": string,"session_id": string
                  }
                  Update: {
                    "content"?: string,"created_at"?: string,"id"?: string,"input_tokens"?: number | null,"output_tokens"?: number | null,"role"?: string,"session_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "chat_messages_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "chat_sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"chat_sessions": {
                  Row: {
                    "created_at": string,"id": string,"ip_hash": string,"last_message_at": string,"lead_id": string | null,"message_count": number,"page_path": string | null,"status": string,"updated_at": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"ip_hash": string,"last_message_at"?: string,"lead_id"?: string | null,"message_count"?: number,"page_path"?: string | null,"status"?: string,"updated_at"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"ip_hash"?: string,"last_message_at"?: string,"lead_id"?: string | null,"message_count"?: number,"page_path"?: string | null,"status"?: string,"updated_at"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "chat_sessions_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"chat_usage_daily": {
                  Row: {
                    "input_tokens": number,"output_tokens": number,"requests": number,"updated_at": string,"usage_date": string
                  }
                  ComputedFields: never
                  Insert: {
                    "input_tokens"?: number,"output_tokens"?: number,"requests"?: number,"updated_at"?: string,"usage_date": string
                  }
                  Update: {
                    "input_tokens"?: number,"output_tokens"?: number,"requests"?: number,"updated_at"?: string,"usage_date"?: string
                  }
                  Relationships: [
                    
                  ]
                },"construction_updates": {
                  Row: {
                    "body": string | null,"content_status": Database["public"]['Enums']["content_status"],"cover_alt": string | null,"cover_path": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"id": string,"photo_ids": (string)[],"project_id": string,"published_at": string | null,"source_report_id": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"content_status"?: Database["public"]['Enums']["content_status"],"cover_alt"?: string | null,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"id"?: string,"photo_ids"?: (string)[],"project_id": string,"published_at"?: string | null,"source_report_id"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string | null,"content_status"?: Database["public"]['Enums']["content_status"],"cover_alt"?: string | null,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"id"?: string,"photo_ids"?: (string)[],"project_id"?: string,"published_at"?: string | null,"source_report_id"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "construction_updates_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"facilities": {
                  Row: {
                    "created_at": string,"created_by": string | null,"deleted_at": string | null,"description": string | null,"icon": string | null,"id": string,"name": string,"project_id": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"icon"?: string | null,"id"?: string,"name": string,"project_id": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"icon"?: string | null,"id"?: string,"name"?: string,"project_id"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "facilities_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"faqs": {
                  Row: {
                    "answer": string,"category": string | null,"content_status": Database["public"]['Enums']["content_status"],"created_at": string,"created_by": string | null,"deleted_at": string | null,"id": string,"project_id": string | null,"question": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answer": string,"category"?: string | null,"content_status"?: Database["public"]['Enums']["content_status"],"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"id"?: string,"project_id"?: string | null,"question": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "answer"?: string,"category"?: string | null,"content_status"?: Database["public"]['Enums']["content_status"],"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"id"?: string,"project_id"?: string | null,"question"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "faqs_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"form_submissions": {
                  Row: {
                    "created_at": string,"form_kind": Database["public"]['Enums']["form_kind"],"id": string,"ip_hash": string | null,"job_application_id": string | null,"lead_id": string | null,"page_path": string | null,"payload": NonNullable<Json>,"status": Database["public"]['Enums']["submission_status"],"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"form_kind": Database["public"]['Enums']["form_kind"],"id"?: string,"ip_hash"?: string | null,"job_application_id"?: string | null,"lead_id"?: string | null,"page_path"?: string | null,"payload"?: NonNullable<Json>,"status": Database["public"]['Enums']["submission_status"],"user_agent"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"form_kind"?: Database["public"]['Enums']["form_kind"],"id"?: string,"ip_hash"?: string | null,"job_application_id"?: string | null,"lead_id"?: string | null,"page_path"?: string | null,"payload"?: NonNullable<Json>,"status"?: Database["public"]['Enums']["submission_status"],"user_agent"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "form_submissions_job_application_id_fkey"
      columns: ["job_application_id"]
isOneToOne: false
      referencedRelation: "job_applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "form_submissions_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"job_applications": {
                  Row: {
                    "career_id": string,"consent_pdp_at": string,"consent_text_version": string,"cover_note": string | null,"created_at": string,"created_by": string | null,"cv_path": string,"deleted_at": string | null,"email": string,"full_name": string,"id": string,"phone": string,"status": Database["public"]['Enums']["application_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "career_id": string,"consent_pdp_at": string,"consent_text_version": string,"cover_note"?: string | null,"created_at"?: string,"created_by"?: string | null,"cv_path": string,"deleted_at"?: string | null,"email": string,"full_name": string,"id"?: string,"phone": string,"status"?: Database["public"]['Enums']["application_status"],"updated_at"?: string
                  }
                  Update: {
                    "career_id"?: string,"consent_pdp_at"?: string,"consent_text_version"?: string,"cover_note"?: string | null,"created_at"?: string,"created_by"?: string | null,"cv_path"?: string,"deleted_at"?: string | null,"email"?: string,"full_name"?: string,"id"?: string,"phone"?: string,"status"?: Database["public"]['Enums']["application_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "job_applications_career_id_fkey"
      columns: ["career_id"]
isOneToOne: false
      referencedRelation: "careers"
      referencedColumns: ["id"]
    }
                  ]
                },"lead_activities": {
                  Row: {
                    "actor_id": string | null,"body": string | null,"client_id": string | null,"created_at": string,"created_by": string | null,"id": string,"lead_id": string,"meta": NonNullable<Json>,"occurred_at": string,"type": Database["public"]['Enums']["lead_activity_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"body"?: string | null,"client_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"lead_id": string,"meta"?: NonNullable<Json>,"occurred_at"?: string,"type": Database["public"]['Enums']["lead_activity_type"]
                  }
                  Update: {
                    "actor_id"?: string | null,"body"?: string | null,"client_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"lead_id"?: string,"meta"?: NonNullable<Json>,"occurred_at"?: string,"type"?: Database["public"]['Enums']["lead_activity_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "lead_activities_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lead_activities_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"leads": {
                  Row: {
                    "consent_pdp_at": string | null,"consent_text_version": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"email": string | null,"fbc": string | null,"fbp": string | null,"first_response_at": string | null,"full_name": string,"id": string,"last_activity_at": string,"lost_reason": string | null,"merged_into_id": string | null,"meta_lead_id": string | null,"note": string | null,"owner_id": string | null,"phone": string,"project_id": string | null,"sla_due_at": string | null,"source_detail": string | null,"source_kind": Database["public"]['Enums']["lead_source_kind"],"stage": Database["public"]['Enums']["lead_stage"],"team_id": string | null,"unit_type_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "consent_pdp_at"?: string | null,"consent_text_version"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"email"?: string | null,"fbc"?: string | null,"fbp"?: string | null,"first_response_at"?: string | null,"full_name": string,"id"?: string,"last_activity_at"?: string,"lost_reason"?: string | null,"merged_into_id"?: string | null,"meta_lead_id"?: string | null,"note"?: string | null,"owner_id"?: string | null,"phone": string,"project_id"?: string | null,"sla_due_at"?: string | null,"source_detail"?: string | null,"source_kind": Database["public"]['Enums']["lead_source_kind"],"stage"?: Database["public"]['Enums']["lead_stage"],"team_id"?: string | null,"unit_type_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "consent_pdp_at"?: string | null,"consent_text_version"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"email"?: string | null,"fbc"?: string | null,"fbp"?: string | null,"first_response_at"?: string | null,"full_name"?: string,"id"?: string,"last_activity_at"?: string,"lost_reason"?: string | null,"merged_into_id"?: string | null,"meta_lead_id"?: string | null,"note"?: string | null,"owner_id"?: string | null,"phone"?: string,"project_id"?: string | null,"sla_due_at"?: string | null,"source_detail"?: string | null,"source_kind"?: Database["public"]['Enums']["lead_source_kind"],"stage"?: Database["public"]['Enums']["lead_stage"],"team_id"?: string | null,"unit_type_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "leads_merged_into_id_fkey"
      columns: ["merged_into_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_unit_type_id_fkey"
      columns: ["unit_type_id"]
isOneToOne: false
      referencedRelation: "unit_types"
      referencedColumns: ["id"]
    }
                  ]
                },"nearby_places": {
                  Row: {
                    "category": string,"created_at": string,"created_by": string | null,"deleted_at": string | null,"distance_km": number | null,"id": string,"name": string,"project_id": string,"sort_order": number,"travel_minutes": number | null,"travel_mode": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"distance_km"?: number | null,"id"?: string,"name": string,"project_id": string,"sort_order"?: number,"travel_minutes"?: number | null,"travel_mode"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "category"?: string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"distance_km"?: number | null,"id"?: string,"name"?: string,"project_id"?: string,"sort_order"?: number,"travel_minutes"?: number | null,"travel_mode"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "nearby_places_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "author_id": string | null,"body": NonNullable<Json>,"content_status": Database["public"]['Enums']["content_status"],"cover_alt": string | null,"cover_path": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"excerpt": string | null,"id": string,"published_at": string | null,"scheduled_at": string | null,"slug": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body"?: NonNullable<Json>,"content_status"?: Database["public"]['Enums']["content_status"],"cover_alt"?: string | null,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"excerpt"?: string | null,"id"?: string,"published_at"?: string | null,"scheduled_at"?: string | null,"slug": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: NonNullable<Json>,"content_status"?: Database["public"]['Enums']["content_status"],"cover_alt"?: string | null,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"excerpt"?: string | null,"id"?: string,"published_at"?: string | null,"scheduled_at"?: string | null,"slug"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "activated_at": string | null,"avatar_path": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"email": string,"full_name": string,"id": string,"invited_at": string | null,"invited_by": string | null,"is_active": boolean,"last_seen_at": string | null,"needs_password": boolean,"phone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activated_at"?: string | null,"avatar_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"email"?: string,"full_name"?: string,"id": string,"invited_at"?: string | null,"invited_by"?: string | null,"is_active"?: boolean,"last_seen_at"?: string | null,"needs_password"?: boolean,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "activated_at"?: string | null,"avatar_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"email"?: string,"full_name"?: string,"id"?: string,"invited_at"?: string | null,"invited_by"?: string | null,"is_active"?: boolean,"last_seen_at"?: string | null,"needs_password"?: boolean,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"project_assignments": {
                  Row: {
                    "created_at": string,"created_by": string | null,"project_id": string,"role_on_project": Database["public"]['Enums']["project_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"project_id": string,"role_on_project": Database["public"]['Enums']["project_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"project_id"?: string,"role_on_project"?: Database["public"]['Enums']["project_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_assignments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"project_media": {
                  Row: {
                    "alt": string,"caption": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"height": number | null,"id": string,"kind": Database["public"]['Enums']["media_kind"],"path": string,"project_id": string,"sort_order": number,"updated_at": string,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt": string,"caption"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"height"?: number | null,"id"?: string,"kind"?: Database["public"]['Enums']["media_kind"],"path": string,"project_id": string,"sort_order"?: number,"updated_at"?: string,"width"?: number | null
                  }
                  Update: {
                    "alt"?: string,"caption"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"height"?: number | null,"id"?: string,"kind"?: Database["public"]['Enums']["media_kind"],"path"?: string,"project_id"?: string,"sort_order"?: number,"updated_at"?: string,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_media_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "address": string | null,"city": string | null,"content_status": Database["public"]['Enums']["content_status"],"created_at": string,"created_by": string | null,"deleted_at": string | null,"description": string | null,"district": string | null,"id": string,"is_featured": boolean,"lat": number | null,"launched_on": string | null,"legal_summary": NonNullable<Json>,"lng": number | null,"name": string,"postal_code": string | null,"province": string | null,"siteplan_svg_path": string | null,"slug": string,"sold_out_on": string | null,"sort_order": number,"status": Database["public"]['Enums']["project_status"],"tagline": string | null,"updated_at": string,"village": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"city"?: string | null,"content_status"?: Database["public"]['Enums']["content_status"],"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"district"?: string | null,"id"?: string,"is_featured"?: boolean,"lat"?: number | null,"launched_on"?: string | null,"legal_summary"?: NonNullable<Json>,"lng"?: number | null,"name": string,"postal_code"?: string | null,"province"?: string | null,"siteplan_svg_path"?: string | null,"slug": string,"sold_out_on"?: string | null,"sort_order"?: number,"status"?: Database["public"]['Enums']["project_status"],"tagline"?: string | null,"updated_at"?: string,"village"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"city"?: string | null,"content_status"?: Database["public"]['Enums']["content_status"],"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"district"?: string | null,"id"?: string,"is_featured"?: boolean,"lat"?: number | null,"launched_on"?: string | null,"legal_summary"?: NonNullable<Json>,"lng"?: number | null,"name"?: string,"postal_code"?: string | null,"province"?: string | null,"siteplan_svg_path"?: string | null,"slug"?: string,"sold_out_on"?: string | null,"sort_order"?: number,"status"?: Database["public"]['Enums']["project_status"],"tagline"?: string | null,"updated_at"?: string,"village"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"promos": {
                  Row: {
                    "body": NonNullable<Json>,"content_status": Database["public"]['Enums']["content_status"],"cover_alt": string | null,"cover_path": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"ends_at": string | null,"id": string,"project_id": string | null,"slug": string,"starts_at": string | null,"summary": string | null,"terms": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: NonNullable<Json>,"content_status"?: Database["public"]['Enums']["content_status"],"cover_alt"?: string | null,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"ends_at"?: string | null,"id"?: string,"project_id"?: string | null,"slug": string,"starts_at"?: string | null,"summary"?: string | null,"terms"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: NonNullable<Json>,"content_status"?: Database["public"]['Enums']["content_status"],"cover_alt"?: string | null,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"ends_at"?: string | null,"id"?: string,"project_id"?: string | null,"slug"?: string,"starts_at"?: string | null,"summary"?: string | null,"terms"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "promos_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"rate_limits": {
                  Row: {
                    "count": number,"key": string,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "count"?: number,"key": string,"window_start": string
                  }
                  Update: {
                    "count"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"site_settings": {
                  Row: {
                    "is_public": boolean,"key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "is_public"?: boolean,"key": string,"updated_at"?: string,"updated_by"?: string | null,"value": NonNullable<Json>
                  }
                  Update: {
                    "is_public"?: boolean,"key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"team_members": {
                  Row: {
                    "created_at": string,"created_by": string | null,"receives_leads": boolean,"team_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"receives_leads"?: boolean,"team_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"receives_leads"?: boolean,"team_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "team_members_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"teams": {
                  Row: {
                    "created_at": string,"created_by": string | null,"deleted_at": string | null,"id": string,"kind": Database["public"]['Enums']["team_kind"],"leader_id": string | null,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["team_kind"],"leader_id"?: string | null,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["team_kind"],"leader_id"?: string | null,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "teams_leader_id_fkey"
      columns: ["leader_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"unit_types": {
                  Row: {
                    "bathrooms": number,"bedrooms": number,"building_area": number,"created_at": string,"created_by": string | null,"deleted_at": string | null,"floor_plan_path": string | null,"floors": number,"id": string,"land_area": number,"name": string,"price_from": number | null,"project_id": string,"show_price": boolean,"slug": string,"sort_order": number,"specs": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bathrooms": number,"bedrooms": number,"building_area": number,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"floor_plan_path"?: string | null,"floors"?: number,"id"?: string,"land_area": number,"name": string,"price_from"?: number | null,"project_id": string,"show_price"?: boolean,"slug": string,"sort_order"?: number,"specs"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "bathrooms"?: number,"bedrooms"?: number,"building_area"?: number,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"floor_plan_path"?: string | null,"floors"?: number,"id"?: string,"land_area"?: number,"name"?: string,"price_from"?: number | null,"project_id"?: string,"show_price"?: boolean,"slug"?: string,"sort_order"?: number,"specs"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "unit_types_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"units": {
                  Row: {
                    "block": string,"building_area": number | null,"code": string,"created_at": string,"created_by": string | null,"deleted_at": string | null,"facing": string | null,"held_by": string | null,"hold_expires_at": string | null,"id": string,"is_corner": boolean,"land_area": number | null,"number": string,"price": number | null,"project_id": string,"siteplan_shape_id": string | null,"status": Database["public"]['Enums']["unit_status"],"unit_type_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "block": string,"building_area"?: number | null,"code": string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"facing"?: string | null,"held_by"?: string | null,"hold_expires_at"?: string | null,"id"?: string,"is_corner"?: boolean,"land_area"?: number | null,"number": string,"price"?: number | null,"project_id": string,"siteplan_shape_id"?: string | null,"status"?: Database["public"]['Enums']["unit_status"],"unit_type_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "block"?: string,"building_area"?: number | null,"code"?: string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"facing"?: string | null,"held_by"?: string | null,"hold_expires_at"?: string | null,"id"?: string,"is_corner"?: boolean,"land_area"?: number | null,"number"?: string,"price"?: number | null,"project_id"?: string,"siteplan_shape_id"?: string | null,"status"?: Database["public"]['Enums']["unit_status"],"unit_type_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "units_held_by_fkey"
      columns: ["held_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "units_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "units_unit_type_id_fkey"
      columns: ["unit_type_id"]
isOneToOne: false
      referencedRelation: "unit_types"
      referencedColumns: ["id"]
    }
                  ]
                },"user_roles": {
                  Row: {
                    "created_at": string,"created_by": string | null,"is_primary": boolean,"role": Database["public"]['Enums']["app_role"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"is_primary"?: boolean,"role": Database["public"]['Enums']["app_role"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"is_primary"?: boolean,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_roles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"utm_touchpoints": {
                  Row: {
                    "created_at": string,"fbc": string | null,"fbclid": string | null,"fbp": string | null,"id": string,"landing_path": string | null,"lead_id": string | null,"occurred_at": string,"referrer": string | null,"utm_campaign": string | null,"utm_content": string | null,"utm_medium": string | null,"utm_source": string | null,"utm_term": string | null,"visitor_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"fbc"?: string | null,"fbclid"?: string | null,"fbp"?: string | null,"id"?: string,"landing_path"?: string | null,"lead_id"?: string | null,"occurred_at"?: string,"referrer"?: string | null,"utm_campaign"?: string | null,"utm_content"?: string | null,"utm_medium"?: string | null,"utm_source"?: string | null,"utm_term"?: string | null,"visitor_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"fbc"?: string | null,"fbclid"?: string | null,"fbp"?: string | null,"id"?: string,"landing_path"?: string | null,"lead_id"?: string | null,"occurred_at"?: string,"referrer"?: string | null,"utm_campaign"?: string | null,"utm_content"?: string | null,"utm_medium"?: string | null,"utm_source"?: string | null,"utm_term"?: string | null,"visitor_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "utm_touchpoints_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"webauthn_challenges": {
                  Row: {
                    "challenge": string,"created_at": string,"expires_at": string,"id": string,"payload": NonNullable<Json>,"purpose": string,"used_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "challenge": string,"created_at"?: string,"expires_at": string,"id"?: string,"payload"?: NonNullable<Json>,"purpose": string,"used_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "challenge"?: string,"created_at"?: string,"expires_at"?: string,"id"?: string,"payload"?: NonNullable<Json>,"purpose"?: string,"used_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "webauthn_challenges_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"webauthn_credentials": {
                  Row: {
                    "counter": number,"created_at": string,"credential_id": string,"device_label": string | null,"id": string,"last_used_at": string | null,"public_key": string,"revoked_at": string | null,"revoked_by": string | null,"transports": (string)[],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "counter"?: number,"created_at"?: string,"credential_id": string,"device_label"?: string | null,"id"?: string,"last_used_at"?: string | null,"public_key": string,"revoked_at"?: string | null,"revoked_by"?: string | null,"transports"?: (string)[],"user_id": string
                  }
                  Update: {
                    "counter"?: number,"created_at"?: string,"credential_id"?: string,"device_label"?: string | null,"id"?: string,"last_used_at"?: string | null,"public_key"?: string,"revoked_at"?: string | null,"revoked_by"?: string | null,"transports"?: (string)[],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "webauthn_credentials_revoked_by_fkey"
      columns: ["revoked_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "webauthn_credentials_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"work_locations": {
                  Row: {
                    "created_at": string,"created_by": string | null,"deleted_at": string | null,"id": string,"is_active": boolean,"kind": Database["public"]['Enums']["work_location_kind"],"lat": number,"lng": number,"name": string,"project_id": string | null,"radius_m": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"id"?: string,"is_active"?: boolean,"kind": Database["public"]['Enums']["work_location_kind"],"lat": number,"lng": number,"name": string,"project_id"?: string | null,"radius_m"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"id"?: string,"is_active"?: boolean,"kind"?: Database["public"]['Enums']["work_location_kind"],"lat"?: number,"lng"?: number,"name"?: string,"project_id"?: string | null,"radius_m"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "work_locations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"work_reports": {
                  Row: {
                    "attachments": NonNullable<Json>,"content": string,"created_at": string,"id": string,"kind": Database["public"]['Enums']["work_report_kind"],"updated_at": string,"user_id": string,"work_date": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attachments"?: NonNullable<Json>,"content": string,"created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["work_report_kind"],"updated_at"?: string,"user_id": string,"work_date": string
                  }
                  Update: {
                    "attachments"?: NonNullable<Json>,"content"?: string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["work_report_kind"],"updated_at"?: string,"user_id"?: string,"work_date"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "work_reports_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"work_schedules": {
                  Row: {
                    "created_at": string,"created_by": string | null,"end_time": string,"id": string,"late_tolerance_min": number,"scope": Database["public"]['Enums']["schedule_scope"],"start_time": string,"updated_at": string,"user_id": string | null,"work_location_id": string | null,"workdays": (number)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"end_time": string,"id"?: string,"late_tolerance_min"?: number,"scope": Database["public"]['Enums']["schedule_scope"],"start_time": string,"updated_at"?: string,"user_id"?: string | null,"work_location_id"?: string | null,"workdays"?: (number)[]
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"end_time"?: string,"id"?: string,"late_tolerance_min"?: number,"scope"?: Database["public"]['Enums']["schedule_scope"],"start_time"?: string,"updated_at"?: string,"user_id"?: string | null,"work_location_id"?: string | null,"workdays"?: (number)[]
                  }
                  Relationships: [
                    {
      foreignKeyName: "work_schedules_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_schedules_work_location_id_fkey"
      columns: ["work_location_id"]
isOneToOne: false
      referencedRelation: "work_locations"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "attendance_clock":
{ Args: { "p_accuracy": number,"p_kind": Database["public"]['Enums']["attendance_kind"],"p_lat": number,"p_lng": number,"p_photo_path": string }; Returns: Json
                           },
"chat_record_usage":
{ Args: { "p_input_tokens": number,"p_output_tokens": number }; Returns: undefined
                           },
"custom_access_token_hook":
{ Args: { "event": Json }; Returns: Json
                           },
"decide_attendance_exception":
{ Args: { "p_actor": string,"p_credential_id"?: string,"p_decision": Database["public"]['Enums']["approval_decision"],"p_id": string,"p_lat"?: number,"p_lng"?: number,"p_method"?: Database["public"]['Enums']["signature_method"],"p_note"?: string,"p_user_agent"?: string }; Returns: Json
                           },
"document_hash":
{ Args: { "p_doc_id": string,"p_doc_type": Database["public"]['Enums']["approval_doc_type"] }; Returns: string
                           },
"normalize_phone_id":
{ Args: { "input": string }; Returns: string
                           },
"rate_limit_hit":
{ Args: { "p_key": string,"p_max": number,"p_window_seconds": number }; Returns: boolean
                           },
"request_attendance_exception":
{ Args: { "p_accuracy": number,"p_kind": Database["public"]['Enums']["attendance_kind"],"p_lat": number,"p_lng": number,"p_photo_path": string,"p_reason": string }; Returns: string
                           },
"set_user_active":
{ Args: { "p_active": boolean,"p_user": string }; Returns: undefined
                           },
"set_user_role":
{ Args: { "p_role": Database["public"]['Enums']["app_role"],"p_user": string }; Returns: undefined
                           },
"set_user_roles":
{ Args: { "p_primary": Database["public"]['Enums']["app_role"],"p_roles": (Database["public"]['Enums']["app_role"])[],"p_user": string }; Returns: undefined
                           },
"submit_work_report":
{ Args: { "p_attachments"?: Json,"p_content": string,"p_kind": Database["public"]['Enums']["work_report_kind"] }; Returns: string
                           },
"upsert_lead":
{ Args: { "p_consent_text_version": string,"p_email": string,"p_fbc"?: string,"p_fbp"?: string,"p_full_name": string,"p_note": string,"p_phone": string,"p_project_id": string,"p_source_detail": string,"p_source_kind": Database["public"]['Enums']["lead_source_kind"],"p_unit_type_id": string }; Returns: {
              "is_new": boolean,"lead_id": string
            }[]
                           },
"verify_approval":
{ Args: { "p_code": string }; Returns: Json
                           }
          }
          Enums: {
            "app_role": "owner"|"admin"|"marketing_manager"|"marketing"|"site_manager"|"site_supervisor"|"finance"|"cms","application_status": "baru"|"diproses"|"wawancara"|"diterima"|"ditolak","approval_decision": "disetujui"|"ditolak","approval_doc_type": "absen_luar_lokasi","attendance_kind": "masuk"|"pulang","audit_action": "insert"|"update"|"delete"|"soft_delete","career_level": "berpengalaman"|"lulusan_baru"|"lapangan"|"magang","content_status": "draft"|"terjadwal"|"terbit"|"arsip","form_kind": "minat"|"kontak"|"brosur"|"landing_page"|"karir"|"chat","lead_activity_type": "telepon"|"whatsapp"|"email"|"survei"|"pertemuan"|"catatan"|"perubahan_tahap"|"dokumen"|"sistem","lead_source_kind": "website"|"landing_page"|"meta_lead_ads"|"chat"|"manual"|"walk_in"|"instagram"|"whatsapp"|"referral","lead_stage": "baru"|"dihubungi"|"prospek"|"jadwal_survei"|"sudah_survei"|"negosiasi"|"booking_fee"|"proses_berkas"|"akad"|"batal","media_kind": "foto"|"video"|"siteplan"|"denah"|"brosur","project_role": "supervisor"|"manager"|"marketing","project_status": "segera"|"tersedia"|"sold_out","request_status": "menunggu"|"disetujui"|"ditolak","schedule_scope": "perusahaan"|"lokasi"|"karyawan","signature_method": "password"|"biometrik"|"cadangan","submission_status": "diterima"|"ditolak_validasi"|"ditolak_honeypot"|"ditolak_rate_limit"|"ditolak_turnstile","team_kind": "marketing"|"lapangan","unit_status": "tersedia"|"hold"|"booking"|"terjual","work_location_kind": "kantor"|"proyek","work_report_kind": "rencana"|"hasil"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "app_role": ["owner", "admin", "marketing_manager", "marketing", "site_manager", "site_supervisor", "finance", "cms"],"application_status": ["baru", "diproses", "wawancara", "diterima", "ditolak"],"approval_decision": ["disetujui", "ditolak"],"approval_doc_type": ["absen_luar_lokasi"],"attendance_kind": ["masuk", "pulang"],"audit_action": ["insert", "update", "delete", "soft_delete"],"career_level": ["berpengalaman", "lulusan_baru", "lapangan", "magang"],"content_status": ["draft", "terjadwal", "terbit", "arsip"],"form_kind": ["minat", "kontak", "brosur", "landing_page", "karir", "chat"],"lead_activity_type": ["telepon", "whatsapp", "email", "survei", "pertemuan", "catatan", "perubahan_tahap", "dokumen", "sistem"],"lead_source_kind": ["website", "landing_page", "meta_lead_ads", "chat", "manual", "walk_in", "instagram", "whatsapp", "referral"],"lead_stage": ["baru", "dihubungi", "prospek", "jadwal_survei", "sudah_survei", "negosiasi", "booking_fee", "proses_berkas", "akad", "batal"],"media_kind": ["foto", "video", "siteplan", "denah", "brosur"],"project_role": ["supervisor", "manager", "marketing"],"project_status": ["segera", "tersedia", "sold_out"],"request_status": ["menunggu", "disetujui", "ditolak"],"schedule_scope": ["perusahaan", "lokasi", "karyawan"],"signature_method": ["password", "biometrik", "cadangan"],"submission_status": ["diterima", "ditolak_validasi", "ditolak_honeypot", "ditolak_rate_limit", "ditolak_turnstile"],"team_kind": ["marketing", "lapangan"],"unit_status": ["tersedia", "hold", "booking", "terjual"],"work_location_kind": ["kantor", "proyek"],"work_report_kind": ["rencana", "hasil"]
          }
        }
} as const
