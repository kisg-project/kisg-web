
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "audit_log": {
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
                },"profiles": {
                  Row: {
                    "avatar_path": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"email": string,"full_name": string,"id": string,"is_active": boolean,"last_seen_at": string | null,"phone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"email"?: string,"full_name"?: string,"id": string,"is_active"?: boolean,"last_seen_at"?: string | null,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "avatar_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"email"?: string,"full_name"?: string,"id"?: string,"is_active"?: boolean,"last_seen_at"?: string | null,"phone"?: string | null,"updated_at"?: string
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
                    "created_at": string,"created_by": string | null,"role": Database["public"]['Enums']["app_role"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"role": Database["public"]['Enums']["app_role"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_roles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
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
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"id"?: string,"is_active"?: boolean,"kind": Database["public"]['Enums']["work_location_kind"],"lat": number,"lng": number,"name": string,"project_id"?: string | null,"radius_m": number,"updated_at"?: string
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
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "custom_access_token_hook":
{ Args: { "event": Json }; Returns: Json
                           },
"normalize_phone_id":
{ Args: { "input": string }; Returns: string
                           },
"rate_limit_hit":
{ Args: { "p_key": string,"p_max": number,"p_window_seconds": number }; Returns: boolean
                           },
"set_user_active":
{ Args: { "p_active": boolean,"p_user": string }; Returns: undefined
                           },
"set_user_role":
{ Args: { "p_role": Database["public"]['Enums']["app_role"],"p_user": string }; Returns: undefined
                           }
          }
          Enums: {
            "app_role": "owner"|"admin"|"marketing_manager"|"marketing"|"site_manager"|"site_supervisor"|"finance","audit_action": "insert"|"update"|"delete"|"soft_delete","content_status": "draft"|"terjadwal"|"terbit"|"arsip","project_role": "supervisor"|"manager"|"marketing","project_status": "segera"|"tersedia"|"sold_out","team_kind": "marketing"|"lapangan","unit_status": "tersedia"|"hold"|"booking"|"terjual","work_location_kind": "kantor"|"proyek"
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
            "app_role": ["owner", "admin", "marketing_manager", "marketing", "site_manager", "site_supervisor", "finance"],"audit_action": ["insert", "update", "delete", "soft_delete"],"content_status": ["draft", "terjadwal", "terbit", "arsip"],"project_role": ["supervisor", "manager", "marketing"],"project_status": ["segera", "tersedia", "sold_out"],"team_kind": ["marketing", "lapangan"],"unit_status": ["tersedia", "hold", "booking", "terjual"],"work_location_kind": ["kantor", "proyek"]
          }
        }
} as const
