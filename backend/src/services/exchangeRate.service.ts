import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface RateCache {
  rates: {
    PYG: number;
    BRL: number;
  } | null;
  timestamp: number;
}

let cachedRates: RateCache = {
  rates: null,
  timestamp: 0,
};

const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

export const getExchangeRates = async () => {
  const now = Date.now();

  if (cachedRates.rates && (now - cachedRates.timestamp < CACHE_DURATION_MS)) {
    console.log('[BACKEND] Usando tasas de cambio desde la caché.');
    return cachedRates.rates;
  }

  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) {
      throw new Error('No se ha configurado la API Key para las tasas de cambio.');
    }

    console.log('[BACKEND] Obteniendo nuevas tasas de cambio desde ExchangeRate-API...');
    const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
    
    const response = await axios.get(apiUrl);

    const ratesData = response.data.conversion_rates;

    if (!ratesData.PYG || !ratesData.BRL) {
        throw new Error('La respuesta de la API no contiene las monedas requeridas (PYG, BRL).');
    }

    cachedRates = {
      rates: {
        PYG: ratesData.PYG,
        BRL: ratesData.BRL,
      },
      timestamp: now,
    };

    return cachedRates.rates;
  } catch (error) {
    console.error("Error al obtener tasas de cambio:", error);
    if (cachedRates.rates) {
      return cachedRates.rates;
    }
    throw new Error('No se pudieron obtener las tasas de cambio.');
  }
};