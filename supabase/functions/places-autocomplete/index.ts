import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await userClient.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    const body = await req.json();
    const query = (body.query || '').trim();
    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use Google Places API (New) — searchText
    const url = 'https://places.googleapis.com/v1/places:searchText';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents',
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'pt-BR',
        locationBias: {
          circle: {
            center: { latitude: -27.87, longitude: -54.48 },
            radius: 500000,
          },
        },
        maxResultCount: 5,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Places API error:', JSON.stringify(data));
      return new Response(JSON.stringify({ results: [], error: data.error?.message }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = (data.places || []).map((p: any) => {
      // Extract city from addressComponents
      let city = '';
      for (const comp of (p.addressComponents || [])) {
        if (comp.types?.includes('administrative_area_level_2') || comp.types?.includes('locality')) {
          city = comp.longText || comp.shortText || '';
          break;
        }
      }

      return {
        place_id: p.id,
        name: p.displayName?.text || '',
        address: p.formattedAddress || '',
        lat: p.location?.latitude || 0,
        lng: p.location?.longitude || 0,
        city,
      };
    });

    return new Response(JSON.stringify({ results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('places-autocomplete error:', error);
    return new Response(
      JSON.stringify({ results: [], error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
