export function googlePermissionMessage(status:number, body:string) {
  let reason:string|undefined;
  try { const value=JSON.parse(body) as {error?:{details?:{reason?:string}[]}};reason=value.error?.details?.find(item=>item.reason)?.reason; } catch { /* Provider may return non-JSON errors. */ }
  if(reason==="API_KEY_HTTP_REFERRER_BLOCKED") return 'A chave de servidor do Google Maps exige restrição por IP ou "Nenhuma", não por site.';
  if(reason==="API_KEY_SERVICE_BLOCKED") return "Habilite Geocoding API e Places API (New) nas permissões da chave de servidor do Google Maps.";
  return `O Google Maps recusou o acesso (${status}). Confira as permissões e a cobrança no Google Cloud.`;
}