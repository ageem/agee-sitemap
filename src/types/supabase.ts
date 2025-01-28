export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      analysis_history: {
        Row: {
          id: string
          created_at: string
          user_id: string
          sitemap_url: string
          results: Json
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          sitemap_url: string
          results: Json
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          sitemap_url?: string
          results?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
