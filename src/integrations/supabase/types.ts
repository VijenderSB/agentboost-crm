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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_phone_numbers: {
        Row: {
          created_at: string
          id: string
          is_whatsapp: boolean
          label: string
          phone_number: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_whatsapp?: boolean
          label?: string
          phone_number: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_whatsapp?: boolean
          label?: string
          phone_number?: string
          user_id?: string
        }
        Relationships: []
      }
      eye_centres: {
        Row: {
          address: string
          city: string
          created_at: string
          google_maps_url: string
          id: string
          name: string
          status: string
        }
        Insert: {
          address?: string
          city?: string
          created_at?: string
          google_maps_url?: string
          id?: string
          name: string
          status?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          google_maps_url?: string
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      followups: {
        Row: {
          assigned_to: string
          completed: boolean
          created_at: string
          followup_date: string
          id: string
          lead_id: string
        }
        Insert: {
          assigned_to: string
          completed?: boolean
          created_at?: string
          followup_date: string
          id?: string
          lead_id: string
        }
        Update: {
          assigned_to?: string
          completed?: boolean
          created_at?: string
          followup_date?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          followup_date: string | null
          id: string
          lead_id: string
          remarks: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          followup_date?: string | null
          id?: string
          lead_id: string
          remarks?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          followup_date?: string | null
          id?: string
          lead_id?: string
          remarks?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_assignments: {
        Row: {
          assigned_by: string
          assigned_to: string
          created_at: string
          id: string
          lead_id: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          created_at?: string
          id?: string
          lead_id: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          created_at?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_eye_centres: {
        Row: {
          eye_centre_id: string
          id: string
          lead_id: string
          referred_at: string
          referred_by: string
        }
        Insert: {
          eye_centre_id: string
          id?: string
          lead_id: string
          referred_at?: string
          referred_by: string
        }
        Update: {
          eye_centre_id?: string
          id?: string
          lead_id?: string
          referred_at?: string
          referred_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_eye_centres_eye_centre_id_fkey"
            columns: ["eye_centre_id"]
            isOneToOne: false
            referencedRelation: "eye_centres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_eye_centres_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_ownership_history: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          lead_id: string
          owner_id: string
          started_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          lead_id: string
          owner_id: string
          started_at?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          lead_id?: string
          owner_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_ownership_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_references: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          reference_mobile: string
          reference_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          reference_mobile: string
          reference_name?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          reference_mobile?: string
          reference_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_references_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          alternative_mobile: string | null
          city: string
          conversion_owner_id: string | null
          created_at: string
          current_owner_id: string
          first_owner_id: string
          followup_date: string | null
          id: string
          mobile: string
          name: string
          notes: string | null
          source: Database["public"]["Enums"]["lead_source"]
          source_type: string
          status: Database["public"]["Enums"]["lead_status"]
          temperature: Database["public"]["Enums"]["lead_temperature"]
          updated_at: string
          website_name: string | null
        }
        Insert: {
          alternative_mobile?: string | null
          city?: string
          conversion_owner_id?: string | null
          created_at?: string
          current_owner_id: string
          first_owner_id: string
          followup_date?: string | null
          id?: string
          mobile: string
          name?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          source_type?: string
          status?: Database["public"]["Enums"]["lead_status"]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
          website_name?: string | null
        }
        Update: {
          alternative_mobile?: string | null
          city?: string
          conversion_owner_id?: string | null
          created_at?: string
          current_owner_id?: string
          first_owner_id?: string
          followup_date?: string | null
          id?: string
          mobile?: string
          name?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          source_type?: string
          status?: Database["public"]["Enums"]["lead_status"]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
          website_name?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          link?: string | null
          message?: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          mobile: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          mobile?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mobile?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      round_robin_state: {
        Row: {
          id: string
          last_agent_index: number
          updated_at: string
        }
        Insert: {
          id?: string
          last_agent_index?: number
          updated_at?: string
        }
        Update: {
          id?: string
          last_agent_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reshuffle_leads: { Args: { _triggered_by: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "manager" | "agent"
      lead_source:
        | "query_form"
        | "whatsapp"
        | "ivr"
        | "chat"
        | "justdial"
        | "indiamart"
        | "google_business"
        | "practo"
        | "facebook"
        | "instagram"
        | "whatsapp_ads"
        | "reference"
        | "walkin"
        | "manual"
      lead_status: "fresh" | "connected" | "not_connected" | "followup"
      lead_temperature:
        | "super_hot"
        | "hot"
        | "warm"
        | "cold"
        | "junk"
        | "success"
        | "lost"
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
  public: {
    Enums: {
      app_role: ["admin", "manager", "agent"],
      lead_source: [
        "query_form",
        "whatsapp",
        "ivr",
        "chat",
        "justdial",
        "indiamart",
        "google_business",
        "practo",
        "facebook",
        "instagram",
        "whatsapp_ads",
        "reference",
        "walkin",
        "manual",
      ],
      lead_status: ["fresh", "connected", "not_connected", "followup"],
      lead_temperature: [
        "super_hot",
        "hot",
        "warm",
        "cold",
        "junk",
        "success",
        "lost",
      ],
    },
  },
} as const
