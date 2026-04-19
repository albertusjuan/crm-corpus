import { BusinessResult } from '@/types'

const SOCIAL_DOMAINS = [
  'facebook.com',
  'instagram.com',
  'linktr.ee',
  'taplink.cc',
  'beacons.ai',
]

export async function scrapeGoogleMaps(
  businessType: string,
  district: string
): Promise<BusinessResult[]> {
  const query = `${businessType} ${district} Hong Kong`

  const response = await fetch(
    `https://api.app.outscraper.com/maps/search?query=${encodeURIComponent(query)}&limit=20&async=false`,
    {
      headers: {
        'X-API-KEY': process.env.OUTSCRAPER_API_KEY!,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) throw new Error(`Outscraper error: ${response.statusText}`)

  const data = await response.json()
  const results = data?.data?.[0] ?? []

  return results.map((r: Record<string, unknown>) => {
    const websiteUrl = r.site as string | null
    const hasRealWebsite =
      !!websiteUrl && !SOCIAL_DOMAINS.some((d) => websiteUrl.includes(d))

    return {
      google_place_id:
        (r.place_id as string) ??
        (r.cid as string) ??
        (r.google_id as string) ??
        '',
      business_name: r.name as string,
      business_type: businessType,
      district,
      full_address: (r.full_address as string) ?? null,
      phone: (r.phone as string) ?? null,
      google_maps_url: (r.url as string) ?? null,
      google_rating: (r.rating as number) ?? null,
      google_review_count: (r.reviews as number) ?? null,
      instagram_handle:
        ((r.instagram as string)?.replace('@', '')) ?? null,
      facebook_url: (r.facebook as string) ?? null,
      has_website: hasRealWebsite,
      website_url: websiteUrl,
      raw_data: r,
    }
  })
}
