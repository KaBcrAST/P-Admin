import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import authService from '../services/authService';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

declare global {
  interface Window {
    L: any;
  }
}

interface Prediction {
  probability: number;
  confidence: number;
  sampleSize: number;
}

interface PredictionResponse {
  success: boolean;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  time: {
    dayOfWeek: number;
    hourOfDay: number;
    date: Date;
  };
  predictions: {
    [key: string]: Prediction;
  };
  metadata: {
    totalHistoricalReports: number;
    dataPeriodDays: number;
    reportsByType: {
      [key: string]: number;
    };
  };
}

interface PeakTime {
  hour: number;
  count: number;
  percentage: number;
}

interface PeakDay {
  day: number;
  dayName: string;
  count: number;
  percentage: number;
}

interface PeakTimesResponse {
  success: boolean;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  peakHours: {
    [key: string]: PeakTime[];
  };
  peakDays: {
    [key: string]: PeakDay[];
  };
  metadata: {
    dataPeriod: string;
    startDate: Date;
    reportType: string;
  };
}

interface Incident {
  _id: string;
  type: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  count: number;
  upvotes: number;
  createdAt: string;
}

const incidentTypes = ['ACCIDENT', 'TRAFFIC_JAM', 'ROAD_CLOSED', 'POLICE', 'OBSTACLE'];

const Predictions: React.FC = () => {
  const [latitude, setLatitude] = useState<number>(48.8566);
  const [longitude, setLongitude] = useState<number>(2.3522);
  const [radius, setRadius] = useState<number>(1000);
  const [selectedType, setSelectedType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [searchAddressInput, setSearchAddressInput] = useState<string>('');
  const [predictions, setPredictions] = useState<PredictionResponse | null>(null);
  const [peakTimes, setPeakTimes] = useState<PeakTimesResponse | null>(null);
  
  const [activeTab, setActiveTab] = useState<'predictions' | 'peakTimes' | 'incidents'>('predictions');

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState<boolean>(false);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite'>('standard');
  
  const mapRef = useRef<any>(null);
  const mapInitializedRef = useRef<boolean>(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://react-gpsapi.vercel.app/api';

  const initMap = () => {
    console.log("Tentative d'initialisation de la carte");
    
    if (typeof window.L === 'undefined') {
      console.error("Leaflet n'est pas chargé");
      return null;
    }
  
    const mapContainer = document.getElementById('incident-map');
    if (!mapContainer) {
      console.error("Le conteneur de carte 'incident-map' n'existe pas dans le DOM");
      return null;
    }
    
    if (mapInitializedRef.current && mapRef.current) {
      console.log("Carte déjà initialisée, réutilisation");
      return mapRef.current;
    }
    
    try {
      console.log("Création d'une nouvelle carte Leaflet");
      
      const map = window.L.map('incident-map').setView([latitude, longitude], mapZoom);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      
      mapRef.current = map;
      mapInitializedRef.current = true;
      
      window.L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup('Position actuelle')
        .openPopup();
      
      map.on('click', (e: any) => {
        setLatitude(e.latlng.lat);
        setLongitude(e.latlng.lng);
      });
      
      console.log("Carte initialisée avec succès");
      return map;
    } catch (err) {
      console.error("Erreur lors de l'initialisation de la carte:", err);
      mapInitializedRef.current = false;
      return null;
    }
  };

  useEffect(() => {
    if (window.L && !mapInitializedRef.current && document.getElementById('incident-map')) {
      initMap();
      return;
    }
    
    if (!document.getElementById('leaflet-script')) {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        document.head.appendChild(linkElement);
      }
      
      const scriptElement = document.createElement('script');
      scriptElement.id = 'leaflet-script';
      scriptElement.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
      
      scriptElement.onload = () => {
        if (document.getElementById('incident-map')) {
          initMap();
        }
      };
      
      document.body.appendChild(scriptElement);
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapInitializedRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    const loadLeaflet = () => {
      if (activeTab !== 'incidents') return;
      
      console.log("Chargement de Leaflet pour l'onglet 'incidents'");
      
      if (window.L) {
        console.log("Leaflet déjà chargé, tentative d'initialisation de la carte");
        setTimeout(() => {
          if (document.getElementById('incident-map')) {
            initMap();
          }
        }, 300); 
        return;
      }
      
      console.log("Chargement du script Leaflet");
      
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        document.head.appendChild(linkElement);
      }
      
      const scriptElement = document.createElement('script');
      scriptElement.id = 'leaflet-script';
      scriptElement.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
      
      scriptElement.onload = () => {
        console.log("Script Leaflet chargé");
        setTimeout(() => {
          if (document.getElementById('incident-map')) {
            initMap();
          }
        }, 300);
      };
      
      document.body.appendChild(scriptElement);
    };

    loadLeaflet();
    
    return () => {
      if (mapRef.current && activeTab !== 'incidents') {
        console.log("Nettoyage de la carte Leaflet");
        mapRef.current.remove();
        mapInitializedRef.current = false;
      }
    };
  }, [activeTab]); 

  useEffect(() => {
    if (activeTab === 'incidents' && !mapInitializedRef.current && document.getElementById('incident-map')) {
      const timer = setTimeout(() => {
        if (window.L) {
          initMap();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab]);
  
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], mapZoom);
      
      mapRef.current.eachLayer((layer: any) => {
        if (layer instanceof window.L.Marker && !layer.options.incident) {
          mapRef.current.removeLayer(layer);
        }
      });
      
      window.L.marker([latitude, longitude])
        .addTo(mapRef.current)
        .bindPopup('Position actuelle')
        .openPopup();
    }
  }, [latitude, longitude, mapZoom]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("La géolocalisation n'est pas prise en charge par votre navigateur");
      return;
    }
    
    setLocationLoading(true);
    setLocationStatus("Détection de votre position...");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationStatus("Position détectée avec succès");
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationStatus("Vous avez refusé la demande de géolocalisation");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationStatus("Les informations de localisation sont indisponibles");
            break;
          case error.TIMEOUT:
            setLocationStatus("La demande de localisation a expiré");
            break;
          default:
            setLocationStatus("Une erreur inconnue est survenue lors de la géolocalisation");
            break;
        }
      },
      { 
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };
  
  const searchAddress = async (address: string) => {
    if (!address.trim()) return;
    
    try {
      setLocationLoading(true);
      setLocationStatus("Recherche de l'adresse...");
      
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      
      if (response.data && response.data.length > 0) {
        const location = response.data[0];
        setLatitude(parseFloat(location.lat));
        setLongitude(parseFloat(location.lon));
        setLocationStatus(`Adresse trouvée: ${location.display_name}`);
      } else {
        setLocationStatus("Aucun résultat trouvé pour cette adresse");
      }
    } catch (err) {
      console.error("Erreur lors de la recherche d'adresse:", err);
      setLocationStatus("Erreur lors de la recherche de l'adresse");
    } finally {
      setLocationLoading(false);
    }
  };

  const predictIncidents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = authService.getToken();
      if (!token) {
        setError("Session expirée, veuillez vous reconnecter");
        setLoading(false);
        return;
      }
      
      const axiosConfig = {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          latitude,
          longitude,
          radius,
          date: new Date().toISOString()
        }
      };
      
      const response = await axios.get(`${API_URL}/predictions/incidents`, axiosConfig);
      
      if (response.data.success) {
        setPredictions(response.data);
      } else {
        setError("La requête a échoué: " + (response.data.message || "Erreur inconnue"));
      }
    } catch (err: any) {
      console.error("Erreur lors de la prédiction:", err);
      setError(err.response?.data?.message || "Erreur lors de la prédiction d'incidents");
    } finally {
      setLoading(false);
    }
  };

  const getPeakTimes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = authService.getToken();
      if (!token) {
        setError("Session expirée, veuillez vous reconnecter");
        setLoading(false);
        return;
      }
      
      const axiosConfig = {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          latitude,
          longitude,
          radius,
          type: selectedType || undefined
        }
      };
      
      const response = await axios.get(`${API_URL}/predictions/peakTimes`, axiosConfig);
      
      if (response.data.success) {
        setPeakTimes(response.data);
      } else {
        setError("La requête a échoué: " + (response.data.message || "Erreur inconnue"));
      }
    } catch (err: any) {
      console.error("Erreur lors de la récupération des heures de pointe:", err);
      setError(err.response?.data?.message || "Erreur lors de la récupération des heures de pointe");
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidents = async () => {
    try {
      setIncidentsLoading(true);
      setError('');
      
      const token = authService.getToken();
      if (!token) {
        setError("Session expirée, veuillez vous reconnecter");
        setIncidentsLoading(false);
        return;
      }
      
      const axiosConfig = {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          type: selectedType || undefined,
          limit: 500 
        }
      };
      
      console.log("Récupération de tous les incidents...");
      
      const response = await axios.get(`${API_URL}/reports/all`, axiosConfig);
      
      if (response.data.success) {
        console.log(`${response.data.reports.length} incidents récupérés`);
        setIncidents(response.data.reports || []);
        displayIncidentsOnMap(response.data.reports || []);
      } else {
        setError("Erreur lors de la récupération des incidents: " + response.data.message);
      }
    } catch (err: any) {
      console.error("Erreur lors de la récupération des incidents:", err);
      setError(err.response?.data?.message || "Erreur lors de la récupération des incidents");
    } finally {
      setIncidentsLoading(false);
    }
  };

const displayIncidentsOnMap = (incidents: Incident[]) => {
  console.log(`Tentative d'affichage de ${incidents.length} incidents sur la carte`);
  
  if (!window.L) {
    console.error("Leaflet n'est pas chargé, impossible d'afficher les incidents");
    return;
  }
  
  if (!mapRef.current) {
    console.log("La carte n'est pas initialisée, tentative d'initialisation");
    const map = initMap();
    if (!map) {
      console.error("Impossible d'initialiser la carte");
      return;
    }
  }
  
  mapRef.current.eachLayer((layer: any) => {
    if (layer instanceof window.L.Marker && layer.options.incident) {
      mapRef.current.removeLayer(layer);
    }
  });
  
  console.log(`Ajout de ${incidents.length} incidents sur la carte`);
  
  const markers = window.L.featureGroup();
  let validIncidents = 0;
  
  const getIncidentColor = (type: string) => {
    switch (type) {
      case 'ACCIDENT': return 'red';
      case 'TRAFFIC_JAM': return 'orange';
      case 'ROAD_CLOSED': return 'purple';
      case 'POLICE': return 'blue';
      case 'OBSTACLE': return 'brown';
      default: return 'gray';
    }
  };
  
  incidents.forEach(incident => {
    try {
      if (!incident.location || !incident.location.coordinates || 
          !Array.isArray(incident.location.coordinates) || 
          incident.location.coordinates.length !== 2) {
        console.warn("Incident avec coordonnées invalides:", incident);
        return;
      }
      
      const lng = incident.location.coordinates[0];
      const lat = incident.location.coordinates[1];
      
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        console.warn("Incident avec coordonnées hors limites:", incident);
        return;
      }
      
      const incidentIcon = window.L.divIcon({
        className: 'custom-incident-marker',
        html: `<div style="
          width: ${10 + (incident.count || 1) * 3}px;
          height: ${10 + (incident.count || 1) * 3}px;
          background-color: ${getIncidentColor(incident.type)};
          border-radius: 50%;
          opacity: 0.7;
          border: 2px solid white;
        "></div>`,
        iconSize: [15 + (incident.count || 1) * 3, 15 + (incident.count || 1) * 3]
      });
      
      const marker = window.L.marker([lat, lng], {
        icon: incidentIcon,
        incident: true 
      })
        .addTo(mapRef.current)
        .bindPopup(`
          <strong>${incident.type.replace('_', ' ')}</strong><br>
          Date: ${new Date(incident.createdAt).toLocaleString()}<br>
          Nombre: ${incident.count || 1}<br>
          Votes: ${incident.upvotes || 0}
        `);
      
      markers.addLayer(marker);
      validIncidents++;
    } catch (err) {
      console.error("Erreur lors de l'ajout d'un incident sur la carte:", err);
    }
  });
  
  console.log(`${validIncidents} incidents valides affichés sur la carte`);
  
  if (validIncidents > 0) {
    try {
      setTimeout(() => {
        try {
          const bounds = markers.getBounds();
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } catch (e) {
          console.warn("Impossible d'adapter la carte aux marqueurs:", e);
        }
      }, 200);
    } catch (e) {
      console.warn("Erreur lors de l'ajustement des limites de la carte:", e);
    }
  }
};

  const toggleMapStyle = () => {
    if (!mapRef.current || !window.L) return;
    
    mapRef.current.eachLayer((layer: any) => {
      if (layer instanceof window.L.TileLayer) {
        mapRef.current.removeLayer(layer);
      }
    });
    
    if (mapStyle === 'standard') {
      window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Imagery © Esri'
      }).addTo(mapRef.current);
      setMapStyle('satellite');
    } else {
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
      setMapStyle('standard');
    }
  };

  const preparePredictionChart = () => {
    if (!predictions) return null;

    const labels = Object.keys(predictions.predictions);
    const probabilities = labels.map(key => predictions.predictions[key].probability);
    const confidences = labels.map(key => predictions.predictions[key].confidence);

    const data = {
      labels,
      datasets: [
        {
          label: 'Probabilité (%)',
          data: probabilities.map(p => parseFloat(p.toFixed(2))),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        },
        {
          label: 'Confiance (%)',
          data: confidences.map(c => parseFloat(c.toFixed(2))),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        }
      ]
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: 'Prédictions d\'incidents'
        }
      }
    };

    return { data, options };
  };

  const preparePieChart = () => {
    if (!predictions) return null;

    const labels = Object.keys(predictions.metadata.reportsByType);
    const counts = labels.map(key => predictions.metadata.reportsByType[key]);

    const data = {
      labels,
      datasets: [
        {
          data: counts,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }
      ]
    };

    return data;
  };

  const preparePeakHoursChart = () => {
    if (!peakTimes) return null;

    const type = selectedType || Object.keys(peakTimes.peakHours)[0];
    if (!type || !peakTimes.peakHours[type]) return null;

    const hourData = [...peakTimes.peakHours[type]].sort((a, b) => a.hour - b.hour);
    
    const data = {
      labels: hourData.map(item => `${item.hour}h`),
      datasets: [
        {
          label: 'Nombre d\'incidents',
          data: hourData.map(item => item.count),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1
        }
      ]
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: `Incidents par heure (${type})`
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };

    return { data, options };
  };

  const preparePeakDaysChart = () => {
    if (!peakTimes) return null;

    const type = selectedType || Object.keys(peakTimes.peakDays)[0];
    if (!type || !peakTimes.peakDays[type]) return null;

    const sortedDays = [...peakTimes.peakDays[type]].sort((a, b) => a.day - b.day);
    
    const data = {
      labels: sortedDays.map(item => item.dayName),
      datasets: [
        {
          label: 'Nombre d\'incidents',
          data: sortedDays.map(item => item.count),
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          borderColor: 'rgb(153, 102, 255)',
          borderWidth: 1
        }
      ]
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: `Incidents par jour (${type})`
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };

    return { data, options };
  };

  const predictionChart = preparePredictionChart();
  const pieChart = preparePieChart();
  const peakHoursChart = preparePeakHoursChart();
  const peakDaysChart = preparePeakDaysChart();

  const fetchAllIncidents = useEffect(() => {
    if (activeTab === 'incidents' && incidents.length === 0 && !incidentsLoading) {
      console.log("Chargement automatique des incidents");
      fetchIncidents();
    }
  }, [activeTab, incidents.length, incidentsLoading]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Prédictions et Analyses</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-900/50 dark:border-red-700 dark:text-red-200">
          <p>{error}</p>
        </div>
      )}
      
      {locationStatus && (
        <div className={`mb-4 p-4 border-l-4 ${
          locationStatus.includes("succès") || locationStatus.includes("trouvée")
            ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-200"
            : "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-200"
        }`}>
          <p>{locationStatus}</p>
        </div>
      )}

      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('incidents')}
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'incidents'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
            >
              Carte des incidents
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('predictions')}
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'predictions'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
            >
              Prédictions d'incidents
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('peakTimes')}
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'peakTimes'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
            >
              Heures de pointe
            </button>
          </li>
        </ul>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mb-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 dark:text-gray-200">Localisation</h3>
          
          <div className="flex space-x-2 mb-4">
            <button
              onClick={detectLocation}
              disabled={locationLoading}
              className={`px-4 py-2 rounded font-medium text-white ${
                locationLoading ? "bg-indigo-700 opacity-70 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {locationLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Détection...
                </span>
              ) : (
                <>
                  <svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Détecter ma position
                </>
              )}
            </button>
            
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Rechercher une adresse..."
                value={searchAddressInput}
                onChange={(e) => setSearchAddressInput(e.target.value)}
                className="w-full p-2 pl-10 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && searchAddress(searchAddressInput)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <button
                onClick={() => searchAddress(searchAddressInput)}
                className="absolute inset-y-0 right-0 px-3 bg-gray-200 dark:bg-gray-600 rounded-r hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                OK
              </button>
            </div>
          </div>
          
          <div className="h-48 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4 overflow-hidden">
            <iframe
              title="Location Map"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.01}%2C${longitude + 0.01}%2C${latitude + 0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`}
              style={{ border: '1px solid #ddd' }}
            ></iframe>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium mb-1 dark:text-gray-300">
              Latitude
            </label>
            <input
              id="latitude"
              type="number"
              step="0.000001"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value))}
              className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="longitude" className="block text-sm font-medium mb-1 dark:text-gray-300">
              Longitude
            </label>
            <input
              id="longitude"
              type="number"
              step="0.000001"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value))}
              className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="radius" className="block text-sm font-medium mb-1 dark:text-gray-300">
              Rayon (m)
            </label>
            <input
              id="radius"
              type="number"
              min="100"
              max="10000"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-1 dark:text-gray-300">
              Type d'incident
            </label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:text-white"
            >
              <option value="">Tous les types</option>
              {incidentTypes.map(type => (
                <option key={type} value={type}>{type.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-3 ml-4 self-end">
            {activeTab === 'incidents' && (
              <button
                onClick={fetchIncidents}
                disabled={incidentsLoading}
                className={`px-4 py-2 rounded font-medium text-white ${
                  incidentsLoading ? "bg-blue-700 opacity-70 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {incidentsLoading ? "Chargement..." : "Afficher les incidents"}
              </button>
            )}
            
            {activeTab === 'predictions' && (
              <button
                onClick={predictIncidents}
                disabled={loading}
                className={`px-4 py-2 rounded font-medium text-white ${
                  loading ? "bg-blue-700 opacity-70 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Calcul en cours..." : "Calculer les prédictions"}
              </button>
            )}
            
            {activeTab === 'peakTimes' && (
              <button
                onClick={getPeakTimes}
                disabled={loading}
                className={`px-4 py-2 rounded font-medium text-white ${
                  loading ? "bg-blue-700 opacity-70 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Analyse en cours..." : "Analyser les heures de pointe"}
              </button>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'incidents' && (
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-gray-200">Carte des incidents</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setMapZoom(mapZoom + 1)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Zoom avant"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setMapZoom(Math.max(mapZoom - 1, 1))}
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Zoom arrière"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={toggleMapStyle}
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Changer le style de carte"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div id="incident-map" 
  className="h-[500px] rounded-lg border border-gray-200 dark:border-gray-700"
  style={{ width: '100%', height: '500px' }}
/>
            
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm">Accident</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
                <span className="text-sm">Embouteillage</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
                <span className="text-sm">Route fermée</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm">Police</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-brown-500 mr-2"></div>
                <span className="text-sm">Obstacle</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Statistiques des incidents</h3>
            
            {incidents.length > 0 ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total des incidents</p>
                    <p className="text-xl font-bold">{incidents.length}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Incidents les plus récents</p>
                    <p className="text-xl font-bold">
                      {incidents.length > 0 
                        ? new Date(incidents.sort((a, b) => 
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                          )[0].createdAt).toLocaleDateString() 
                        : 'Aucun'
                      }
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Type le plus fréquent</p>
                    <p className="text-xl font-bold">
                      {incidents.length > 0 
                        ? Object.entries(
                            incidents.reduce((acc, incident) => {
                              acc[incident.type] = (acc[incident.type] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).sort((a, b) => b[1] - a[1])[0][0].replace('_', ' ')
                        : 'Aucun'
                      }
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rayon analysé</p>
                    <p className="text-xl font-bold">{radius} mètres</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="py-2 px-4 text-left">Type</th>
                        <th className="py-2 px-4 text-left">Nombre</th>
                        <th className="py-2 px-4 text-left">Pourcentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {Object.entries(
                        incidents.reduce((acc, incident) => {
                          acc[incident.type] = (acc[incident.type] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                        <tr key={type} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="py-2 px-4">{type.replace('_', ' ')}</td>
                          <td className="py-2 px-4">{count}</td>
                          <td className="py-2 px-4">{((count / incidents.length) * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {incidentsLoading ? (
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  "Cliquez sur 'Afficher les incidents' pour visualiser les données"
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'predictions' && (
        <div>
          {predictions ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                  <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Prédictions par type d'incident</h3>
                  {predictionChart && <Bar data={predictionChart.data} options={predictionChart.options} />}
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                  <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Répartition des incidents</h3>
                  {pieChart && <Pie data={pieChart} />}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md overflow-x-auto">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Détails des prédictions</h3>
                <table className="min-w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="py-2 px-4 text-left">Type d'incident</th>
                      <th className="py-2 px-4 text-left">Probabilité (%)</th>
                      <th className="py-2 px-4 text-left">Confiance (%)</th>
                      <th className="py-2 px-4 text-left">Échantillon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {Object.entries(predictions.predictions).map(([type, data]) => (
                      <tr key={type} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-2 px-4">{type}</td>
                        <td className="py-2 px-4">{data.probability.toFixed(2)}%</td>
                        <td className="py-2 px-4">{data.confidence.toFixed(2)}%</td>
                        <td className="py-2 px-4">{data.sampleSize}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Métadonnées</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total d'incidents analysés</p>
                    <p className="text-xl font-bold">{predictions.metadata.totalHistoricalReports}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Période d'analyse</p>
                    <p className="text-xl font-bold">{predictions.metadata.dataPeriodDays} jours</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rayon analysé</p>
                    <p className="text-xl font-bold">{predictions.location.radius} mètres</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                "Entrez les coordonnées et cliquez sur 'Calculer les prédictions' pour afficher les résultats."
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'peakTimes' && (
        <div>
          {peakTimes ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                  <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Incidents par heure</h3>
                  {peakHoursChart && <Bar data={peakHoursChart.data} options={peakHoursChart.options} />}
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                  <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Incidents par jour</h3>
                  {peakDaysChart && <Bar data={peakDaysChart.data} options={peakDaysChart.options} />}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md overflow-x-auto">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Top 3 des heures les plus risquées</h3>
                
                {Object.entries(peakTimes.peakHours).map(([type, hours]) => (
                  <div key={type} className="mb-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{type}</h4>
                    <table className="min-w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="py-2 px-4 text-left">Heure</th>
                          <th className="py-2 px-4 text-left">Nombre d'incidents</th>
                          <th className="py-2 px-4 text-left">Pourcentage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {hours.slice(0, 3).map((hour, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="py-2 px-4">{hour.hour}:00</td>
                            <td className="py-2 px-4">{hour.count}</td>
                            <td className="py-2 px-4">{hour.percentage.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Métadonnées</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Période d'analyse</p>
                    <p className="text-xl font-bold">{peakTimes.metadata.dataPeriod}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Type d'incident</p>
                    <p className="text-xl font-bold">{peakTimes.metadata.reportType}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rayon analysé</p>
                    <p className="text-xl font-bold">{peakTimes.location.radius} mètres</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                "Entrez les coordonnées et cliquez sur 'Analyser les heures de pointe' pour afficher les résultats."
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Predictions;