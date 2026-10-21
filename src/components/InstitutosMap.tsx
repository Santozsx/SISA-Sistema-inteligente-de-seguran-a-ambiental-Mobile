import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors } from '../theme/colors';
import { Instituto } from '../types';
import { distancia } from '../utils/formatar';

type Posicao = { latitude: number; longitude: number };

const markerColor: Record<string, string> = {
  ativo: colors.success,
  'em-rota': colors.warning,
  inativo: colors.textMuted,
};

// Estilo de mapa escuro, alinhado ao Design System do SISA
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#161B26' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9CA3AF' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0F19' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#232A3A' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0D111D' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];

export default function InstitutosMap({ institutos, posicao }: { institutos: Instituto[]; posicao?: Posicao | null }) {
  const comCoordenadas = institutos.filter(
    (i): i is Instituto & Posicao => i.latitude !== null && i.longitude !== null,
  );
  // Centraliza no GPS do aparelho; sem ele, no instituto mais próximo; sem nenhum, no Brasil.
  const centro = posicao ?? comCoordenadas[0] ?? { latitude: -14.2, longitude: -51.9 };
  const zoom = posicao || comCoordenadas.length ? 0.4 : 30;

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      initialRegion={{ latitude: centro.latitude, longitude: centro.longitude, latitudeDelta: zoom, longitudeDelta: zoom }}
      customMapStyle={darkMapStyle}
      showsUserLocation={!!posicao}
    >
      {comCoordenadas.map((i) => (
        <Marker
          key={i.id}
          coordinate={{ latitude: i.latitude, longitude: i.longitude }}
          pinColor={markerColor[i.status]}
          title={i.nome}
          description={`${i.tipo} · ${distancia(i.distancia_km)}`}
        />
      ))}
    </MapView>
  );
}
