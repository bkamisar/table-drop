import { useEffect, useState } from "react";
import type { Restaurant } from "../core/types.js";
import { api } from "./lib/api.js";
import { citiesOf } from "./lib/cities.js";
import { needsVerification } from "./lib/verify.js";
import { CitySwitcher } from "./components/CitySwitcher.js";
import { Welcome } from "./components/Welcome.js";
import { DropsScreen } from "./screens/DropsScreen.js";
import { RestaurantsScreen } from "./screens/RestaurantsScreen.js";
import { VerifyScreen } from "./screens/VerifyScreen.js";

type Screen = "drops" | "restaurants" | "verify";

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="clock" aria-label="Current time">
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </div>
  );
}

export function App() {
  const [screen, setScreen] = useState<Screen>("drops");
  const [city, setCity] = useState("All");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [addPending, setAddPending] = useState(false);

  async function refresh() {
    setRestaurants(await api.listRestaurants());
    setLoaded(true);
  }
  useEffect(() => { void refresh(); }, []);

  const cities = citiesOf(restaurants);
  const toVerify = restaurants.filter(needsVerification).length;
  const empty = loaded && restaurants.length === 0;

  function startAdding() {
    setScreen("restaurants");
    setAddPending(true);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <h1>table drop <span className="mark">🍽️</span></h1>
          <p className="tagline">know the second the hardest tables open.</p>
        </div>
        <div className="header-right">
          <Clock />
          <nav className="screen-tabs">
            <button className={screen === "drops" ? "active" : ""} onClick={() => setScreen("drops")}>Drops</button>
            <button className={screen === "restaurants" ? "active" : ""} onClick={() => setScreen("restaurants")}>My Restaurants</button>
            <button className={screen === "verify" ? "active" : ""} onClick={() => setScreen("verify")}>
              Verify{toVerify > 0 ? ` (${toVerify})` : ""}
            </button>
          </nav>
        </div>
      </header>

      {empty && screen !== "restaurants" ? (
        <Welcome onAdd={startAdding} onImported={refresh} />
      ) : (
        <>
          {cities.length > 0 && <CitySwitcher cities={cities} selected={city} onSelect={setCity} />}
          <main className="app-main">
            {screen === "drops" && <DropsScreen city={city} />}
            {screen === "restaurants" && (
              <RestaurantsScreen
                restaurants={restaurants}
                city={city}
                onChange={refresh}
                startAdding={addPending}
                onStarted={() => setAddPending(false)}
              />
            )}
            {screen === "verify" && <VerifyScreen restaurants={restaurants} city={city} onChange={refresh} />}
          </main>
        </>
      )}

      <footer className="site-footer">
        <p>
          Table Drop never books for you — it counts down to when reservations open and links you to the official
          booking page. Not affiliated with Resy, Tock, OpenTable, SevenRooms, or Zenchef.
        </p>
        {api.kind === "browser" && (
          <p>
            {api.persistent
              ? "Your list is saved only in this browser — use “export list” to back it up or move it to another device."
              : "⚠ This browser isn't saving your list (private browsing?). Export it before you close the tab."}
          </p>
        )}
      </footer>
    </div>
  );
}
