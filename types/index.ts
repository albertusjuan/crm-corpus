export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'responded'
  | 'meeting'
  | 'won'
  | 'lost'
  | 'not_interested'

export interface Lead {
  id: string
  created_at: string
  updated_at: string
  google_place_id: string
  business_name: string
  business_type: string | null
  district: string | null
  full_address: string | null
  phone: string | null
  email: string | null
  google_maps_url: string | null
  google_rating: number | null
  google_review_count: number | null
  instagram_handle: string | null
  facebook_url: string | null
  has_website: boolean
  website_url: string | null
  status: LeadStatus
  notes: string | null
  contacted_at: string | null
  closed_at: string | null
  deal_value_hkd: number
  source: string
  raw_data: Record<string, unknown> | null
}

export interface BusinessResult {
  google_place_id: string
  business_name: string
  business_type: string | null
  district: string
  full_address: string | null
  phone: string | null
  google_maps_url: string | null
  google_rating: number | null
  google_review_count: number | null
  instagram_handle: string | null
  facebook_url: string | null
  has_website: boolean
  website_url: string | null
  raw_data: Record<string, unknown>
}

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  responded: 'Responded',
  meeting: 'Meeting Booked',
  won: 'Won',
  lost: 'Lost',
  not_interested: 'Not Interested',
}

export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  responded: 'bg-orange-100 text-orange-800',
  meeting: 'bg-purple-100 text-purple-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
  not_interested: 'bg-gray-100 text-gray-800',
}

export const STATUS_EMOJI: Record<LeadStatus, string> = {
  new: '🔵',
  contacted: '🟡',
  responded: '🟠',
  meeting: '🟣',
  won: '🟢',
  lost: '🔴',
  not_interested: '⚫',
}

export const HK_DISTRICTS = [
  'Central', 'Sheung Wan', 'Sai Ying Pun', 'Kennedy Town',
  'Admiralty', 'Wan Chai', 'Causeway Bay', 'Happy Valley',
  'North Point', 'Quarry Bay', 'Tai Koo', 'Sai Wan Ho',
  'Shau Kei Wan', 'Chai Wan', 'Aberdeen', 'Stanley',
  'Mong Kok', 'Yau Ma Tei', 'Jordan', 'Tsim Sha Tsui',
  'Hung Hom', 'To Kwa Wan', 'Sham Shui Po', 'Cheung Sha Wan',
  'Lai Chi Kok', 'Kwun Tong', 'Ngau Tau Kok', 'Kowloon Bay',
  'Diamond Hill', 'Wong Tai Sin', 'Sha Tin', 'Tai Po',
  'Tuen Mun', 'Yuen Long', 'Fanling',
] as const

export const BUSINESS_TYPES = [
  'café', 'coffee shop', 'restaurant', 'bakery', 'florist',
  'hair salon', 'nail salon', 'boutique', 'gift shop',
  'bookstore', 'yoga studio', 'gym', 'pet shop',
  'dry cleaning', 'pharmacy',
] as const
