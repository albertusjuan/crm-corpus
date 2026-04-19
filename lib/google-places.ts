import { BusinessResult } from '@/types'

const SOCIAL_DOMAINS = [
  'facebook.com',
  'instagram.com',
  'linktr.ee',
  'taplink.cc',
  'beacons.ai',
]

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
].join(',')

interface PlacesApiPlace {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  websiteUri?: string
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
}

export async function searchGooglePlaces(
  businessType: string,
  district: string
): Promise<BusinessResult[]> {
  const query = `${businessType} ${district} Hong Kong`

  const response = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 20,
        locationBias: {
          circle: {
            center: { latitude: 22.3193, longitude: 114.1694 },
            radius: 50000,
          },
        },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Google Places API error: ${err}`)
  }

  const data = await response.json()
  const places: PlacesApiPlace[] = data.places ?? []

  return places.map((place) => {
    const websiteUrl = place.websiteUri ?? null
    const hasRealWebsite =
      !!websiteUrl && !SOCIAL_DOMAINS.some((d) => websiteUrl.includes(d))

    return {
      google_place_id: place.id,
      business_name: place.displayName?.text ?? 'Unknown',
      business_type: businessType,
      district,
      full_address: place.formattedAddress ?? null,
      phone: place.nationalPhoneNumber ?? null,
      google_maps_url: place.googleMapsUri ?? null,
      google_rating: place.rating ?? null,
      google_review_count: place.userRatingCount ?? null,
      instagram_handle: null,
      facebook_url: null,
      has_website: hasRealWebsite,
      website_url: websiteUrl,
      raw_data: place as unknown as Record<string, unknown>,
    }
  })
}
