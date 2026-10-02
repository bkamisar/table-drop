interface Props {
  cities: string[];
  selected: string; // "All" or a city name
  onSelect: (city: string) => void;
}

export function CitySwitcher({ cities, selected, onSelect }: Props) {
  const tabs = ["All", ...cities];
  return (
    <nav className="city-switcher">
      {tabs.map((city) => (
        <button
          key={city}
          className={city === selected ? "city-tab active" : "city-tab"}
          onClick={() => onSelect(city)}
        >
          {city}
        </button>
      ))}
    </nav>
  );
}
