// 🌍 Base de datos completa de provincias y ciudades de España
// Centralizada para uso en toda la aplicación

export const PROVINCIAS = [
  "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila",
  "Badajoz", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón",
  "Ceuta", "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara",
  "Guipúzcoa", "Huelva", "Huesca", "Islas Baleares", "Jaén", "La Rioja", "Las Palmas",
  "León", "Lleida", "Lugo", "Madrid", "Málaga", "Melilla", "Murcia", "Navarra",
  "Ourense", "Palencia", "Pontevedra", "Salamanca", "Santa Cruz de Tenerife",
  "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia",
  "Valladolid", "Vizcaya", "Zamora", "Zaragoza"
];

export const CIUDADES_POR_PROVINCIA = {
  "Madrid": ["Madrid", "Alcalá de Henares", "Móstoles", "Fuenlabrada", "Leganés", "Getafe", "Alcorcón", "Torrejón de Ardoz", "Parla", "Alcobendas", "Las Rozas", "San Sebastián de los Reyes", "Pozuelo de Alarcón", "Rivas-Vaciamadrid", "Valdemoro", "Coslada", "Majadahonda", "Collado Villalba", "Aranjuez", "Arganda del Rey"],
  "Barcelona": ["Barcelona", "Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell", "Mataró", "Santa Coloma de Gramenet", "Cornellà de Llobregat", "Sant Boi de Llobregat", "Rubí", "Manresa", "Viladecans", "Castelldefels", "Granollers", "Gavà", "Mollet del Vallès", "Cerdanyola del Vallès", "Sant Cugat del Vallès", "El Prat de Llobregat", "Esplugues de Llobregat"],
  "Valencia": ["Valencia", "Gandía", "Torrent", "Paterna", "Sagunto", "Alzira", "Mislata", "Burjassot", "Xirivella", "Manises", "Ontinyent", "Xàtiva", "Sueca", "Algemesí", "Cullera"],
  "Sevilla": ["Sevilla", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Mairena del Aljarafe", "Los Palacios y Villafranca", "Écija", "La Rinconada", "Camas", "Carmona", "Lebrija", "San Juan de Aznalfarache", "Tomares", "Morón de la Frontera", "Coria del Río"],
  "Málaga": ["Málaga", "Marbella", "Mijas", "Vélez-Málaga", "Fuengirola", "Torremolinos", "Estepona", "Benalmádena", "Rincón de la Victoria", "Antequera", "Alhaurín de la Torre", "Ronda", "Nerja", "Coín"],
  "Alicante": ["Alicante", "Elche", "Torrevieja", "Orihuela", "Benidorm", "Alcoy", "Elda", "San Vicente del Raspeig", "Villena", "Santa Pola", "Calpe", "Dénia", "Jávea", "Altea", "Villajoyosa", "Petrer"],
  "Murcia": ["Murcia", "Cartagena", "Lorca", "Molina de Segura", "Alcantarilla", "Mazarrón", "Yecla", "Águilas", "Caravaca de la Cruz", "Cieza", "Totana", "San Javier", "Torre-Pacheco"],
  "Vizcaya": ["Bilbao", "Barakaldo", "Getxo", "Portugalete", "Santurtzi", "Basauri", "Durango", "Sestao", "Leioa", "Galdakao", "Erandio"],
  "Zaragoza": ["Zaragoza", "Calatayud", "Utebo", "Ejea de los Caballeros", "Cuarte de Huerva", "Tarazona", "Caspe"],
  "Las Palmas": ["Las Palmas de Gran Canaria", "Telde", "Santa Lucía", "Arucas", "Agüimes", "Ingenio", "Mogán", "San Bartolomé de Tirajana"],
  "Islas Baleares": ["Palma", "Calvià", "Manacor", "Llucmajor", "Marratxí", "Inca", "Alcúdia", "Felanitx", "Pollença", "Ibiza", "Mahón"],
  "Guipúzcoa": ["Donostia-San Sebastián", "Irún", "Rentería", "Eibar", "Hernani", "Zarautz", "Hondarribia"],
  "Asturias": ["Oviedo", "Gijón", "Avilés", "Siero", "Mieres", "Langreo", "Castrillón", "Llanera"],
  "A Coruña": ["A Coruña", "Santiago de Compostela", "Ferrol", "Narón", "Oleiros", "Arteixo", "Culleredo", "Carballo"],
  "Pontevedra": ["Vigo", "Pontevedra", "Vilagarcía de Arousa", "Redondela", "Cangas", "Marín", "Sanxenxo", "O Porriño"],
  "Cantabria": ["Santander", "Torrelavega", "Castro Urdiales", "Camargo", "Piélagos", "El Astillero", "Laredo"],
  "Córdoba": ["Córdoba", "Lucena", "Puente Genil", "Montilla", "Priego de Córdoba", "Cabra", "Baena"],
  "Granada": ["Granada", "Motril", "Almuñécar", "Baza", "Loja", "Guadix", "Armilla", "Maracena"],
  "Valladolid": ["Valladolid", "Medina del Campo", "Laguna de Duero", "Arroyo de la Encomienda", "Tudela de Duero"],
  "Navarra": ["Pamplona", "Tudela", "Barañáin", "Burlada", "Estella", "Tafalla", "Villava"],
  "Santa Cruz de Tenerife": ["Santa Cruz de Tenerife", "San Cristóbal de La Laguna", "Arona", "Adeje", "Los Realejos", "Granadilla de Abona", "Puerto de la Cruz"],
  "Almería": ["Almería", "Roquetas de Mar", "El Ejido", "Vícar", "Níjar", "Huércal-Overa", "Adra"],
  "Burgos": ["Burgos", "Miranda de Ebro", "Aranda de Duero", "Villarcayo", "Lerma"],
  "Castellón": ["Castellón de la Plana", "Vila-real", "Burriana", "Vinaròs", "Onda", "Almassora", "Benicàssim"],
  "Albacete": ["Albacete", "Hellín", "Villarrobledo", "Almansa", "La Roda", "Caudete"],
  "Álava": ["Vitoria-Gasteiz", "Llodio", "Amurrio"],
  "León": ["León", "Ponferrada", "San Andrés del Rabanedo", "Villaquilambre", "La Bañeza", "Astorga"],
  "Cádiz": ["Cádiz", "Jerez de la Frontera", "Algeciras", "San Fernando", "El Puerto de Santa María", "Chiclana de la Frontera", "La Línea de la Concepción", "Sanlúcar de Barrameda", "Arcos de la Frontera"],
  "Huelva": ["Huelva", "Lepe", "Almonte", "Moguer", "Ayamonte", "Isla Cristina"],
  "Jaén": ["Jaén", "Linares", "Andújar", "Úbeda", "Martos", "Alcalá la Real", "Baeza"],
  "Toledo": ["Toledo", "Talavera de la Reina", "Illescas", "Seseña", "Torrijos", "Quintanar de la Orden"],
  "Tarragona": ["Tarragona", "Reus", "Tortosa", "El Vendrell", "Cambrils", "Valls", "Salou"],
  "Girona": ["Girona", "Figueres", "Blanes", "Lloret de Mar", "Olot", "Salt"],
  "Lleida": ["Lleida", "Tàrrega", "Mollerussa", "Balaguer", "La Seu d'Urgell"],
  "Badajoz": ["Badajoz", "Mérida", "Don Benito", "Almendralejo", "Villanueva de la Serena", "Zafra"],
  "Cáceres": ["Cáceres", "Plasencia", "Navalmoral de la Mata", "Coria", "Trujillo"],
  "Lugo": ["Lugo", "Monforte de Lemos", "Viveiro", "Villalba", "Ribadeo"],
  "Ourense": ["Ourense", "Verín", "O Barco de Valdeorras", "Xinzo de Limia", "Ribadavia"],
  "Salamanca": ["Salamanca", "Béjar", "Ciudad Rodrigo", "Santa Marta de Tormes", "Alba de Tormes"],
  "Ávila": ["Ávila", "Arévalo", "Arenas de San Pedro"],
  "Segovia": ["Segovia", "Cuéllar", "San Ildefonso", "El Espinar"],
  "Soria": ["Soria", "Almazán", "El Burgo de Osma"],
  "Zamora": ["Zamora", "Benavente", "Toro", "Villalpando"],
  "Palencia": ["Palencia", "Guardo", "Aguilar de Campoo", "Venta de Baños"],
  "Guadalajara": ["Guadalajara", "Azuqueca de Henares", "Alovera", "Sigüenza"],
  "Cuenca": ["Cuenca", "Tarancón", "Quintanar del Rey", "San Clemente"],
  "Ciudad Real": ["Ciudad Real", "Puertollano", "Tomelloso", "Valdepeñas", "Alcázar de San Juan", "Daimiel"],
  "Teruel": ["Teruel", "Alcañiz", "Andorra", "Calamocha"],
  "Huesca": ["Huesca", "Monzón", "Barbastro", "Jaca", "Sabiñánigo"],
  "La Rioja": ["Logroño", "Calahorra", "Arnedo", "Haro", "Alfaro"],
  "Ceuta": ["Ceuta"],
  "Melilla": ["Melilla"]
};

// Función helper: obtener todas las ciudades de una provincia
export const getCitiesByProvince = (provincia) => {
  return CIUDADES_POR_PROVINCIA[provincia] || [];
};

// Función helper: verificar si una ciudad pertenece a una provincia
export const isCityInProvince = (ciudad, provincia) => {
  const cities = CIUDADES_POR_PROVINCIA[provincia] || [];
  return cities.includes(ciudad);
};