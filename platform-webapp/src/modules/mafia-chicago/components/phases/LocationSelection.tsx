import { useMafiaStore, Location } from '../../store/mafiaStore'

interface LocationSelectionProps {
  onSelectLocation?: (roomId: string, locationId: string) => void;
}

const LocationSelection: React.FC<LocationSelectionProps> = ({ onSelectLocation }) => {
  const { players, locations, selectLocation, roomId } = useMafiaStore()
  
  const currentPlayer = players[0] // Placeholder
  
  const handleLocationSelect = (location: Location) => {
    if (currentPlayer) {
      selectLocation(currentPlayer.id, location)
      
      if (onSelectLocation && roomId) {
        onSelectLocation(roomId, location)
      }
    }
  }
  
  return (
    <div className="mafia-chicago__location-selection">
      <h2 className="mafia-chicago__subtitle">Выбор локации</h2>
      <p className="mafia-chicago__phase-description">
        Наступила ночь. Выберите локацию, в которой хотите провести ночь.
      </p>
      
      <div className="mafia-chicago__locations-grid">
        {locations.map(loc => (
          <button
            key={loc.location}
            className={`mafia-chicago__location-btn ${!loc.isOpen ? 'mafia-chicago__location-btn--closed' : ''}`}
            onClick={() => handleLocationSelect(loc.location)}
            disabled={!loc.isOpen || currentPlayer?.selectedLocation !== undefined}
          >
            <div className="mafia-chicago__location-icon">
              {getLocationIcon(loc.location)}
            </div>
            <div className="mafia-chicago__location-name">
              {getLocationName(loc.location)}
            </div>
            {(currentPlayer?.role === 'mafia' || currentPlayer?.role === 'doctor' || currentPlayer?.role === 'sheriff') && (
              <div className="mafia-chicago__location-count">
                {loc.playersCount} {getPlayerCountText(loc.playersCount)}
              </div>
            )}
            {!loc.isOpen && (
              <div className="mafia-chicago__location-closed">
                Закрыто
              </div>
            )}
          </button>
        ))}
      </div>
      
      {currentPlayer?.selectedLocation && (
        <div className="mafia-chicago__selection-info">
          Вы выбрали: {getLocationName(currentPlayer.selectedLocation)}
        </div>
      )}
    </div>
  )
}

const getLocationIcon = (location: Location): string => {
  switch (location) {
    case Location.DOWNTOWN:
      return '🏙️'
    case Location.HARBOR:
      return '⚓'
    case Location.SPEAKEASY:
      return '🥃'
    case Location.THEATER:
      return '🎭'
    case Location.PARK:
      return '🌳'
    default:
      return '📍'
  }
}

const getLocationName = (location: Location): string => {
  switch (location) {
    case Location.DOWNTOWN:
      return 'Деловой центр'
    case Location.HARBOR:
      return 'Гавань'
    case Location.SPEAKEASY:
      return 'Подпольный бар'
    case Location.THEATER:
      return 'Театр'
    case Location.PARK:
      return 'Парк'
    default:
      return 'Неизвестная локация'
  }
}

const getPlayerCountText = (count: number): string => {
  if (count === 1) return 'человек'
  if (count >= 2 && count <= 4) return 'человека'
  return 'человек'
}

export default LocationSelection
