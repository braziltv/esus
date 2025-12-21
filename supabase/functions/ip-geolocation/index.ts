import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeoLocation {
  ip: string;
  city: string;
  region: string;
  regionName: string;
  country: string;
  countryCode: string;
  isp: string;
  org: string;
  lat: number;
  lon: number;
  timezone: string;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ips } = await req.json();
    
    if (!ips || !Array.isArray(ips)) {
      return new Response(
        JSON.stringify({ error: 'IPs array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter valid IPs and remove duplicates
    const uniqueIps = [...new Set(ips.filter((ip: string) => ip && ip !== 'N/A'))];
    
    console.log(`Looking up ${uniqueIps.length} unique IPs`);

    // ip-api.com supports batch requests (up to 100 IPs)
    // Free tier: 45 requests per minute
    const results: Record<string, GeoLocation | null> = {};

    // Process in batches of 100
    const batches = [];
    for (let i = 0; i < uniqueIps.length; i += 100) {
      batches.push(uniqueIps.slice(i, i + 100));
    }

    for (const batch of batches) {
      try {
        // Use batch endpoint for efficiency
        const response = await fetch('http://ip-api.com/batch?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        });

        if (response.ok) {
          const data: GeoLocation[] = await response.json();
          data.forEach((geo, index) => {
            if (geo.status === 'success') {
              results[batch[index]] = geo;
            } else {
              results[batch[index]] = null;
            }
          });
        } else {
          // Fallback to individual requests if batch fails
          for (const ip of batch) {
            try {
              const singleResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,query`);
              if (singleResponse.ok) {
                const geo: GeoLocation = await singleResponse.json();
                results[ip] = geo.status === 'success' ? geo : null;
              }
            } catch (e) {
              console.error(`Error fetching geo for ${ip}:`, e);
              results[ip] = null;
            }
          }
        }
      } catch (error) {
        console.error('Batch request error:', error);
        // Set null for all IPs in failed batch
        batch.forEach(ip => { results[ip] = null; });
      }
    }

    console.log(`Successfully resolved ${Object.values(results).filter(Boolean).length} locations`);

    return new Response(
      JSON.stringify({ locations: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ip-geolocation function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
