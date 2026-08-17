export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      employees: {
        Row: {
          created_at: string
          email: string | null
          employee_number: string
          first_name: string
          id: string
          last_name: string
          organisation_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          employee_number: string
          first_name: string
          id?: string
          last_name: string
          organisation_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          employee_number?: string
          first_name?: string
          id?: string
          last_name?: string
          organisation_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_contacts: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_primary: boolean
          notes: string | null
          organisation_id: string
          phone: string | null
          preferred_method: string
          role_label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          organisation_id: string
          phone?: string | null
          preferred_method?: string
          role_label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          organisation_id?: string
          phone?: string | null
          preferred_method?: string
          role_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_contacts_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_memberships: {
        Row: {
          created_at: string
          id: string
          organisation_id: string
          profile_id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organisation_id: string
          profile_id: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organisation_id?: string
          profile_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_memberships_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          code: string | null
          contract_end: string | null
          contract_start: string | null
          country: string | null
          created_at: string
          custom_package_notes: string | null
          id: string
          industry: string | null
          logo_path: string | null
          name: string
          package_name: string | null
          primary_location: string | null
          region: string | null
          slug: string
          status: string
          updated_at: string
          wellness_risk_score: number
          workforce_size: number | null
        }
        Insert: {
          code?: string | null
          contract_end?: string | null
          contract_start?: string | null
          country?: string | null
          created_at?: string
          custom_package_notes?: string | null
          id?: string
          industry?: string | null
          logo_path?: string | null
          name: string
          package_name?: string | null
          primary_location?: string | null
          region?: string | null
          slug: string
          status?: string
          updated_at?: string
          wellness_risk_score?: number
          workforce_size?: number | null
        }
        Update: {
          code?: string | null
          contract_end?: string | null
          contract_start?: string | null
          country?: string | null
          created_at?: string
          custom_package_notes?: string | null
          id?: string
          industry?: string | null
          logo_path?: string | null
          name?: string
          package_name?: string | null
          primary_location?: string | null
          region?: string | null
          slug?: string
          status?: string
          updated_at?: string
          wellness_risk_score?: number
          workforce_size?: number | null
        }
        Relationships: []
      }
      platform_staff_memberships: {
        Row: {
          created_at: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      practitioner_assignments: {
        Row: {
          activity_name: string
          created_at: string
          ends_at: string | null
          id: string
          location: string
          organisation_id: string | null
          practitioner_user_id: string
          programme_name: string
          service_name: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          activity_name: string
          created_at?: string
          ends_at?: string | null
          id?: string
          location: string
          organisation_id?: string | null
          practitioner_user_id: string
          programme_name: string
          service_name: string
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          activity_name?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          location?: string
          organisation_id?: string | null
          practitioner_user_id?: string
          programme_name?: string
          service_name?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_assignments_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_assignments_practitioner_user_id_fkey"
            columns: ["practitioner_user_id"]
            isOneToOne: false
            referencedRelation: "practitioner_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      practitioner_capabilities: {
        Row: {
          approval_status: string
          created_at: string
          id: string
          practitioner_user_id: string
          service_code: string
          service_name: string
          updated_at: string
        }
        Insert: {
          approval_status?: string
          created_at?: string
          id?: string
          practitioner_user_id: string
          service_code: string
          service_name: string
          updated_at?: string
        }
        Update: {
          approval_status?: string
          created_at?: string
          id?: string
          practitioner_user_id?: string
          service_code?: string
          service_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_capabilities_practitioner_user_id_fkey"
            columns: ["practitioner_user_id"]
            isOneToOne: false
            referencedRelation: "practitioner_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      practitioner_documents: {
        Row: {
          document_type: string
          expiry_date: string | null
          file_name: string
          id: string
          practitioner_user_id: string
          reviewed_at: string | null
          storage_path: string
          updated_at: string
          uploaded_at: string
          verification_status: string
        }
        Insert: {
          document_type: string
          expiry_date?: string | null
          file_name: string
          id?: string
          practitioner_user_id: string
          reviewed_at?: string | null
          storage_path: string
          updated_at?: string
          uploaded_at?: string
          verification_status?: string
        }
        Update: {
          document_type?: string
          expiry_date?: string | null
          file_name?: string
          id?: string
          practitioner_user_id?: string
          reviewed_at?: string | null
          storage_path?: string
          updated_at?: string
          uploaded_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_documents_practitioner_user_id_fkey"
            columns: ["practitioner_user_id"]
            isOneToOne: false
            referencedRelation: "practitioner_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      practitioner_profiles: {
        Row: {
          assignment_notifications: boolean
          city: string | null
          country: string
          created_at: string
          document_notifications: boolean
          payment_notifications: boolean
          phone: string | null
          practitioner_status: string
          preferred_contact_method: string
          profession: string
          professional_email: string
          profile_photo_path: string | null
          qualifications: string[]
          registration_authority: string | null
          registration_country: string | null
          registration_expiry_date: string | null
          registration_number: string | null
          specialisation: string | null
          updated_at: string
          user_id: string
          verification_status: string
          years_experience: number
        }
        Insert: {
          assignment_notifications?: boolean
          city?: string | null
          country?: string
          created_at?: string
          document_notifications?: boolean
          payment_notifications?: boolean
          phone?: string | null
          practitioner_status?: string
          preferred_contact_method?: string
          profession: string
          professional_email: string
          profile_photo_path?: string | null
          qualifications?: string[]
          registration_authority?: string | null
          registration_country?: string | null
          registration_expiry_date?: string | null
          registration_number?: string | null
          specialisation?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
          years_experience?: number
        }
        Update: {
          assignment_notifications?: boolean
          city?: string | null
          country?: string
          created_at?: string
          document_notifications?: boolean
          payment_notifications?: boolean
          phone?: string | null
          practitioner_status?: string
          preferred_contact_method?: string
          profession?: string
          professional_email?: string
          profile_photo_path?: string | null
          qualifications?: string[]
          registration_authority?: string | null
          registration_country?: string | null
          registration_expiry_date?: string | null
          registration_number?: string | null
          specialisation?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_organisation_member: {
        Args: { target_organisation_id: string }
        Returns: boolean
      }
      is_platform_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
