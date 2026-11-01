import { BRAZILIAN_STATES, STATES } from "@/data/brazil";

/** Cidades por região (estado / região administrativa) de cada país atendido. */
export type GeoCountry = "BR" | "US" | "PT" | "ES" | "FR" | "IT";

const US: Record<string, string[]> = {
  AL: ["Birmingham", "Montgomery", "Huntsville", "Mobile", "Tuscaloosa"],
  AK: ["Anchorage", "Fairbanks", "Juneau"],
  AZ: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Gilbert", "Glendale", "Tempe", "Flagstaff"],
  AR: ["Little Rock", "Fayetteville", "Fort Smith", "Springdale", "Jonesboro"],
  CA: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach", "Oakland", "Bakersfield", "Anaheim", "Irvine", "Riverside", "Santa Ana", "Stockton", "Pasadena", "Santa Barbara"],
  CO: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Boulder", "Lakewood"],
  CT: ["Bridgeport", "New Haven", "Hartford", "Stamford", "Waterbury"],
  DE: ["Wilmington", "Dover", "Newark"],
  FL: ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "St. Petersburg", "Hialeah", "Tallahassee", "Boca Raton", "West Palm Beach", "Naples", "Sarasota", "Pompano Beach", "Kissimmee", "Doral", "Coral Springs", "Fort Myers", "Gainesville", "Pensacola"],
  GA: ["Atlanta", "Savannah", "Augusta", "Columbus", "Macon", "Athens", "Marietta"],
  HI: ["Honolulu", "Hilo", "Kailua"],
  ID: ["Boise", "Meridian", "Nampa", "Idaho Falls"],
  IL: ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield", "Peoria"],
  IN: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel", "Bloomington"],
  IA: ["Des Moines", "Cedar Rapids", "Davenport", "Iowa City", "Sioux City"],
  KS: ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka"],
  KY: ["Louisville", "Lexington", "Bowling Green", "Owensboro"],
  LA: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles"],
  ME: ["Portland", "Lewiston", "Bangor"],
  MD: ["Baltimore", "Frederick", "Rockville", "Gaithersburg", "Annapolis"],
  MA: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell", "Framingham"],
  MI: ["Detroit", "Grand Rapids", "Warren", "Lansing", "Ann Arbor", "Flint"],
  MN: ["Minneapolis", "Saint Paul", "Rochester", "Duluth", "Bloomington"],
  MS: ["Jackson", "Gulfport", "Southaven", "Hattiesburg", "Biloxi"],
  MO: ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence"],
  MT: ["Billings", "Missoula", "Great Falls", "Bozeman"],
  NE: ["Omaha", "Lincoln", "Bellevue", "Grand Island"],
  NV: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks"],
  NH: ["Manchester", "Nashua", "Concord"],
  NJ: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Trenton", "Edison", "Hoboken", "Newark"],
  NM: ["Albuquerque", "Las Cruces", "Santa Fe", "Rio Rancho"],
  NY: ["New York", "Brooklyn", "Queens", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "White Plains"],
  NC: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Wilmington", "Asheville"],
  ND: ["Fargo", "Bismarck", "Grand Forks"],
  OH: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton"],
  OK: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow"],
  OR: ["Portland", "Salem", "Eugene", "Gresham", "Bend"],
  PA: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Harrisburg"],
  RI: ["Providence", "Warwick", "Cranston"],
  SC: ["Charleston", "Columbia", "Greenville", "Myrtle Beach", "Rock Hill"],
  SD: ["Sioux Falls", "Rapid City"],
  TN: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville", "Murfreesboro"],
  TX: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Plano", "Corpus Christi", "Laredo", "Lubbock", "Irving", "Frisco", "McKinney", "Sugar Land", "The Woodlands"],
  UT: ["Salt Lake City", "West Valley City", "Provo", "Orem", "St. George", "Ogden"],
  VT: ["Burlington", "South Burlington", "Rutland"],
  VA: ["Virginia Beach", "Norfolk", "Richmond", "Arlington", "Alexandria", "Chesapeake", "Newport News"],
  WA: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Everett", "Redmond"],
  WV: ["Charleston", "Huntington", "Morgantown"],
  WI: ["Milwaukee", "Madison", "Green Bay", "Kenosha"],
  WY: ["Cheyenne", "Casper", "Laramie"],
};

const PT: Record<string, string[]> = {
  "Norte": ["Porto", "Braga", "Guimarães", "Vila Nova de Gaia", "Matosinhos", "Maia", "Viana do Castelo", "Vila Real", "Bragança", "Póvoa de Varzim", "Barcelos", "Gondomar", "Valongo", "Famalicão"],
  "Centro": ["Coimbra", "Aveiro", "Leiria", "Viseu", "Figueira da Foz", "Castelo Branco", "Guarda", "Covilhã", "Caldas da Rainha", "Torres Vedras", "Pombal"],
  "Área Metropolitana de Lisboa": ["Lisboa", "Sintra", "Cascais", "Oeiras", "Amadora", "Loures", "Odivelas", "Almada", "Seixal", "Setúbal", "Barreiro", "Vila Franca de Xira", "Mafra"],
  "Alentejo": ["Évora", "Beja", "Portalegre", "Santarém", "Sines", "Elvas"],
  "Algarve": ["Faro", "Portimão", "Albufeira", "Loulé", "Lagos", "Tavira", "Olhão", "Quarteira"],
  "Região Autónoma da Madeira": ["Funchal", "Câmara de Lobos", "Machico"],
  "Região Autónoma dos Açores": ["Ponta Delgada", "Angra do Heroísmo", "Horta"],
};

const ES: Record<string, string[]> = {
  "Comunidad de Madrid": ["Madrid", "Alcalá de Henares", "Móstoles", "Fuenlabrada", "Leganés", "Getafe", "Alcorcón", "Torrejón de Ardoz", "Las Rozas"],
  "Cataluña": ["Barcelona", "L'Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell", "Tarragona", "Lleida", "Girona", "Mataró", "Reus"],
  "Andalucía": ["Sevilla", "Málaga", "Córdoba", "Granada", "Almería", "Huelva", "Cádiz", "Jaén", "Marbella", "Jerez de la Frontera", "Algeciras"],
  "Comunitat Valenciana": ["Valencia", "Alicante", "Elche", "Castellón de la Plana", "Torrevieja", "Benidorm", "Gandía"],
  "País Vasco": ["Bilbao", "Vitoria-Gasteiz", "San Sebastián", "Barakaldo"],
  "Galicia": ["Vigo", "A Coruña", "Ourense", "Lugo", "Santiago de Compostela", "Pontevedra", "Ferrol"],
  "Castilla y León": ["Valladolid", "Burgos", "Salamanca", "León", "Palencia", "Zamora", "Segovia", "Ávila", "Soria"],
  "Castilla-La Mancha": ["Albacete", "Toledo", "Guadalajara", "Ciudad Real", "Talavera de la Reina", "Cuenca"],
  "Aragón": ["Zaragoza", "Huesca", "Teruel"],
  "Región de Murcia": ["Murcia", "Cartagena", "Lorca", "Molina de Segura"],
  "Islas Baleares": ["Palma", "Ibiza", "Manacor", "Mahón"],
  "Canarias": ["Las Palmas de Gran Canaria", "Santa Cruz de Tenerife", "San Cristóbal de La Laguna", "Telde", "Arona"],
  "Principado de Asturias": ["Oviedo", "Gijón", "Avilés"],
  "Extremadura": ["Badajoz", "Cáceres", "Mérida", "Plasencia"],
  "Comunidad Foral de Navarra": ["Pamplona", "Tudela"],
  "Cantabria": ["Santander", "Torrelavega"],
  "La Rioja": ["Logroño", "Calahorra"],
};

const FR: Record<string, string[]> = {
  "Île-de-France": ["Paris", "Boulogne-Billancourt", "Saint-Denis", "Argenteuil", "Montreuil", "Versailles", "Nanterre", "Créteil", "Vitry-sur-Seine"],
  "Auvergne-Rhône-Alpes": ["Lyon", "Grenoble", "Saint-Étienne", "Villeurbanne", "Clermont-Ferrand", "Annecy", "Chambéry", "Valence"],
  "Provence-Alpes-Côte d'Azur": ["Marseille", "Nice", "Toulon", "Aix-en-Provence", "Avignon", "Cannes", "Antibes"],
  "Occitanie": ["Toulouse", "Montpellier", "Nîmes", "Perpignan", "Béziers", "Narbonne"],
  "Nouvelle-Aquitaine": ["Bordeaux", "Limoges", "Poitiers", "Pau", "La Rochelle", "Bayonne", "Mérignac"],
  "Hauts-de-France": ["Lille", "Amiens", "Roubaix", "Tourcoing", "Dunkerque", "Calais"],
  "Grand Est": ["Strasbourg", "Reims", "Metz", "Mulhouse", "Nancy", "Colmar", "Troyes"],
  "Pays de la Loire": ["Nantes", "Angers", "Le Mans", "Saint-Nazaire", "La Roche-sur-Yon"],
  "Bretagne": ["Rennes", "Brest", "Quimper", "Lorient", "Vannes", "Saint-Malo"],
  "Normandie": ["Le Havre", "Rouen", "Caen", "Cherbourg-en-Cotentin", "Évreux"],
  "Bourgogne-Franche-Comté": ["Dijon", "Besançon", "Belfort", "Chalon-sur-Saône", "Auxerre"],
  "Centre-Val de Loire": ["Tours", "Orléans", "Bourges", "Blois", "Chartres"],
  "Corse": ["Ajaccio", "Bastia"],
};

const IT: Record<string, string[]> = {
  "Lombardia": ["Milano", "Brescia", "Monza", "Bergamo", "Como", "Varese", "Pavia", "Cremona", "Mantova", "Lecco"],
  "Lazio": ["Roma", "Latina", "Fiumicino", "Guidonia Montecelio", "Viterbo", "Frosinone", "Rieti"],
  "Campania": ["Napoli", "Salerno", "Giugliano in Campania", "Torre del Greco", "Caserta", "Pozzuoli", "Avellino", "Benevento"],
  "Piemonte": ["Torino", "Novara", "Alessandria", "Asti", "Cuneo", "Moncalieri", "Biella"],
  "Toscana": ["Firenze", "Prato", "Livorno", "Arezzo", "Pisa", "Pistoia", "Lucca", "Siena", "Grosseto"],
  "Veneto": ["Venezia", "Verona", "Padova", "Vicenza", "Treviso", "Rovigo", "Belluno"],
  "Emilia-Romagna": ["Bologna", "Parma", "Modena", "Reggio Emilia", "Ravenna", "Rimini", "Ferrara", "Forlì", "Piacenza"],
  "Sicilia": ["Palermo", "Catania", "Messina", "Siracusa", "Marsala", "Ragusa", "Trapani", "Agrigento"],
  "Puglia": ["Bari", "Taranto", "Foggia", "Andria", "Lecce", "Barletta", "Brindisi"],
  "Liguria": ["Genova", "La Spezia", "Savona", "Sanremo", "Imperia"],
  "Calabria": ["Reggio Calabria", "Catanzaro", "Cosenza", "Crotone", "Lamezia Terme"],
  "Sardegna": ["Cagliari", "Sassari", "Quartu Sant'Elena", "Olbia", "Alghero", "Nuoro"],
  "Marche": ["Ancona", "Pesaro", "Fano", "Ascoli Piceno", "Macerata"],
  "Abruzzo": ["Pescara", "L'Aquila", "Teramo", "Chieti", "Montesilvano"],
  "Friuli-Venezia Giulia": ["Trieste", "Udine", "Pordenone", "Gorizia"],
  "Trentino-Alto Adige": ["Trento", "Bolzano", "Merano", "Rovereto"],
  "Umbria": ["Perugia", "Terni", "Foligno"],
  "Basilicata": ["Potenza", "Matera"],
  "Molise": ["Campobasso", "Isernia"],
  "Valle d'Aosta": ["Aosta"],
};

const BR: Record<string, string[]> = Object.fromEntries(STATES.map((uf) => [uf, BRAZILIAN_STATES[uf].areas]));

const GEO: Record<GeoCountry, Record<string, string[]>> = { BR, US, PT, ES, FR, IT };

export type CityOption = { city: string; region: string };

export function regionsOf(country: GeoCountry): string[] {
  return Object.keys(GEO[country]);
}

/** Cidades do país; filtradas pela região quando informada. Sem repetições. */
export function citiesOf(country: GeoCountry, region?: string): CityOption[] {
  const entries = region && GEO[country][region] ? [[region, GEO[country][region]] as const] : Object.entries(GEO[country]);
  const seen = new Set<string>();
  const out: CityOption[] = [];
  for (const [r, cities] of entries) {
    for (const city of cities) {
      const key = `${city}|${r}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ city, region: r });
    }
  }
  return out.sort((a, b) => a.city.localeCompare(b.city));
}

/** Região de uma cidade, quando ela pertence a uma única região conhecida. */
export function regionOfCity(country: GeoCountry, city: string): string | null {
  const matches = Object.entries(GEO[country]).filter(([, cities]) => cities.includes(city)).map(([r]) => r);
  return matches.length === 1 ? matches[0]! : null;
}
