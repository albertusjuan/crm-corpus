import { NextRequest, NextResponse } from 'next/server'
import { searchGooglePlaces } from '@/lib/google-places'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessType, district } = body

    if (!businessType || !district) {
      return NextResponse.json(
        { error: 'businessType and district are required' },
        { status: 400 }
      )
    }

    const results = await searchGooglePlaces(businessType, district)
    const noWebsiteCount = results.filter((r) => !r.has_website).length

    return NextResponse.json({ results, total: results.length, noWebsiteCount })
  } catch (error) {
    console.error('Google Places error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch results from Google Places' },
      { status: 500 }
    )
  }
}
