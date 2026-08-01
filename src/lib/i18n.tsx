import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { EXTRA_DICTS } from "./i18n-extra";



export type Lang = "de" | "en" | "sq";
export const LANGS: { code: Lang; label: string }[] = [
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
  { code: "sq", label: "Shqip" },
];

type Dict = Record<string, string>;

const de: Dict = {
  "app.name": "EuroDeal",
  "app.tagline": "Immobilien, Autos & Motorräder aus ganz Europa – mit echter Preisbewertung.",
  "nav.feed": "Suche",
  "nav.saved": "Gespeichert",
  "nav.reviews": "Bewertungen",
  "nav.language": "Sprache",
  "nav.back": "Zurück",
  "nav.signin": "Anmelden",
  "nav.signout": "Abmelden",

  "search.placeholder": "z. B. Haus, BMW, Wohnung in Tirana …",
  "search.button": "Suchen",
  "search.running": "Suche läuft …",
  "filters.title": "Filter",
  "filters.category": "Kategorie",
  "filters.all": "Alle",
  "filters.country": "Land",
  "filters.anyCountry": "Alle Länder",
  "filters.city": "Stadt",
  "filters.anyCity": "Alle Städte",
  "filters.radius": "Umkreis",
  "filters.noRadius": "Kein Umkreis",
  "filters.sources": "Quellen",
  "filters.allSources": "Alle Quellen",
  "filters.sourcesSelected": "{n} Quellen ausgewählt",
  "filters.priceMin": "Preis von",
  "filters.priceMax": "Preis bis",
  "filters.reset": "Filter zurücksetzen",
  "filters.apply": "Übernehmen",
  "filters.open": "Filter öffnen",

  "cat.all": "Alle",
  "cat.real_estate": "Immobilien",
  "cat.apartments": "Wohnungen",
  "cat.cars": "Fahrzeuge",
  "cat.motorcycles": "Motorräder",

  "sort.label": "Sortierung",
  "sort.price_asc": "Günstigster Preis",
  "sort.price_desc": "Höchster Preis",
  "sort.newest": "Neueste zuerst",
  "sort.best_deal": "Beste Preisbewertung",

  "results.count": "{n} Treffer",
  "results.none": "Keine Anzeigen gefunden. Passe deine Filter an.",
  "results.more": "Mehr laden",
  "results.loading": "Wird geladen …",

  "band.great": "Sehr günstig",
  "band.good": "Guter Preis",
  "band.fair": "Marktpreis",
  "band.high": "Überteuert",
  "band.check": "Prüfen",
  "band.explain":
    "Median {median} aus {n} vergleichbaren Angeboten – dieses Angebot liegt {diff} {dir}.",
  "band.above": "darüber",
  "band.below": "darunter",
  "band.noData": "Zu wenige Vergleichsangebote für eine Bewertung.",
  "band.how": "Wie wird bewertet?",

  "detail.gallery": "Bilder",
  "detail.details": "Details",
  "detail.description": "Beschreibung",
  "detail.original": "Zur Original-Anzeige",
  "detail.share": "Anzeige teilen",
  "detail.save": "Speichern",
  "detail.saved": "Gespeichert",
  "detail.marketCheck": "Marktpreis-Check",
  "detail.source": "Quelle",
  "detail.posted": "Eingestellt",
  "detail.notFound": "Diese Anzeige ist nicht mehr verfügbar.",
  "detail.copied": "Link kopiert",

  "attr.year": "Baujahr",
  "attr.km": "Kilometerstand",
  "attr.fuel": "Kraftstoff",
  "attr.gearbox": "Getriebe",
  "attr.power_hp": "Leistung",
  "attr.ccm": "Hubraum",
  "attr.sqm": "Wohnfläche",
  "attr.rooms": "Zimmer",
  "attr.floor": "Etage",
  "attr.plot_sqm": "Grundstück",

  "saved.title": "Gespeicherte Anzeigen",
  "saved.empty": "Du hast noch keine Anzeigen gespeichert.",
  "saved.needAuth": "Melde dich an, um Anzeigen dauerhaft zu speichern.",
  "saved.removed": "Aus Favoriten entfernt",
  "saved.added": "Zu Favoriten hinzugefügt",

  "settings.title": "Einstellungen",
  "settings.language": "Sprache",
  "settings.push": "Benachrichtigungen bei neuen Treffern",
  "settings.pushHint":
    "Aktiviere Push, um informiert zu werden, sobald neue Anzeigen zu deinen Filtern passen.",
  "settings.saved": "Einstellungen gespeichert",

  "auth.title": "Anmelden oder registrieren",
  "auth.email": "E-Mail",
  "auth.password": "Passwort",
  "auth.signin": "Anmelden",
  "auth.signup": "Registrieren",
  "auth.switchToSignup": "Noch kein Konto? Jetzt registrieren",
  "auth.switchToSignin": "Schon registriert? Anmelden",
  "auth.checkEmail": "Bitte bestätige deine E-Mail-Adresse.",
  "auth.welcome": "Willkommen zurück!",

  "footer.info": "Info",
  "footer.support": "Support",
  "footer.imprint": "Impressum",
  "footer.reviews": "Bewertungen",
  "footer.invite": "Freunde einladen",
  "footer.copyright": "Alle Rechte vorbehalten © Entwickler: Berat Konjusha",

  "info.title": "Über EuroDeal",
  "info.purposeTitle": "Zweck",
  "info.purpose":
    "EuroDeal bündelt Immobilien-, Fahrzeug- und Motorrad-Anzeigen aus ganz Europa inklusive Balkan an einem Ort. Statt Rohdaten zeigt die App für jedes Angebot eine nachvollziehbare Preisbewertung: Wir vergleichen jede Anzeige mit dem Median vergleichbarer Angebote und markieren, ob sie sehr günstig, marktüblich oder überteuert ist.",
  "info.devTitle": "Entwickler",
  "info.dev": "Berat Konjusha",
  "info.dataTitle": "Datenquellen",
  "info.data":
    "Die Daten stammen aus offiziellen Portal-Schnittstellen und Feeds. EuroDeal speichert nur Metadaten und verlinkt immer auf die Original-Anzeige beim jeweiligen Portal.",

  "support.title": "Support kontaktieren",
  "support.intro": "Schreib uns – wir melden uns per E-Mail zurück.",
  "support.name": "Name",
  "support.email": "E-Mail",
  "support.message": "Nachricht",
  "support.send": "Nachricht senden",
  "support.sent": "Danke! Deine Nachricht wurde gesendet.",
  "support.error": "Nachricht konnte nicht gesendet werden.",

  "imprint.title": "Impressum",
  "imprint.responsible": "Verantwortlich für den Inhalt",
  "imprint.contact": "Kontakt",
  "imprint.disclaimerTitle": "Haftung für Inhalte Dritter",
  "imprint.disclaimer":
    "EuroDeal ist ein Aggregator. Alle Anzeigen stammen von den jeweils genannten Portalen und Anbietern. Für Richtigkeit, Vollständigkeit und Aktualität der Angebote haften ausschließlich die Ursprungsanbieter. Preisbewertungen sind statistische Schätzungen und keine Kaufberatung.",
  "imprint.privacyTitle": "Datenschutz",
  "imprint.privacy":
    "Wir speichern nur Daten, die für den Betrieb erforderlich sind: Kontodaten, Favoriten, Einstellungen sowie freiwillig gesendete Support-Nachrichten und Bewertungen. Es werden keine Tracking-Cookies gesetzt. Auskunft und Löschung jederzeit über die Kontaktadresse.",

  "reviews.title": "Bewertungen",
  "reviews.intro": "Alle Bewertungen sind öffentlich sichtbar.",
  "reviews.average": "Durchschnitt",
  "reviews.count": "{n} Bewertungen",
  "reviews.yourRating": "Deine Bewertung",
  "reviews.yourName": "Dein Name",
  "reviews.yourText": "Dein Kommentar (optional)",
  "reviews.submit": "Bewertung abgeben",
  "reviews.thanks": "Danke für deine Bewertung!",
  "reviews.needAuth": "Melde dich an, um eine Bewertung abzugeben.",
  "reviews.empty": "Noch keine Bewertungen – sei die erste Person!",

  "invite.title": "Freunde einladen",
  "invite.text": "Teile EuroDeal mit deinen Freunden:",
  "invite.copy": "Link kopieren",
  "invite.copied": "Link kopiert",
  "invite.message": "Schau dir EuroDeal an – Immobilien & Fahrzeuge aus ganz Europa mit Preis-Check:",

  "common.close": "Schließen",
  "common.cancel": "Abbrechen",
  "common.km": "km",
  "common.of": "von",
  "common.error": "Etwas ist schiefgelaufen.",
};

const en: Dict = {
  "app.name": "EuroDeal",
  "app.tagline": "Property, cars & motorcycles across Europe – with a real price check.",
  "nav.feed": "Search",
  "nav.saved": "Saved",
  "nav.reviews": "Reviews",
  "nav.language": "Language",
  "nav.back": "Back",
  "nav.signin": "Sign in",
  "nav.signout": "Sign out",

  "search.placeholder": "e.g. house, BMW, apartment in Tirana …",
  "search.button": "Search",
  "search.running": "Searching …",
  "filters.title": "Filters",
  "filters.category": "Category",
  "filters.all": "All",
  "filters.country": "Country",
  "filters.anyCountry": "All countries",
  "filters.city": "City",
  "filters.anyCity": "All cities",
  "filters.radius": "Radius",
  "filters.noRadius": "No radius",
  "filters.sources": "Sources",
  "filters.allSources": "All sources",
  "filters.sourcesSelected": "{n} sources selected",
  "filters.priceMin": "Price from",
  "filters.priceMax": "Price to",
  "filters.reset": "Reset filters",
  "filters.apply": "Apply",
  "filters.open": "Open filters",

  "cat.all": "All",
  "cat.real_estate": "Real estate",
  "cat.apartments": "Apartments",
  "cat.cars": "Cars",
  "cat.motorcycles": "Motorcycles",

  "sort.label": "Sort by",
  "sort.price_asc": "Lowest price",
  "sort.price_desc": "Highest price",
  "sort.newest": "Newest first",
  "sort.best_deal": "Best price rating",

  "results.count": "{n} results",
  "results.none": "No listings found. Try adjusting your filters.",
  "results.more": "Load more",
  "results.loading": "Loading …",

  "band.great": "Very cheap",
  "band.good": "Good price",
  "band.fair": "Market price",
  "band.high": "Overpriced",
  "band.check": "Check carefully",
  "band.explain": "Median {median} from {n} comparable listings – this one is {diff} {dir}.",
  "band.above": "above",
  "band.below": "below",
  "band.noData": "Not enough comparable listings for a rating.",
  "band.how": "How is this rated?",

  "detail.gallery": "Photos",
  "detail.details": "Details",
  "detail.description": "Description",
  "detail.original": "Go to original listing",
  "detail.share": "Share listing",
  "detail.save": "Save",
  "detail.saved": "Saved",
  "detail.marketCheck": "Market price check",
  "detail.source": "Source",
  "detail.posted": "Posted",
  "detail.notFound": "This listing is no longer available.",
  "detail.copied": "Link copied",

  "attr.year": "Year",
  "attr.km": "Mileage",
  "attr.fuel": "Fuel",
  "attr.gearbox": "Gearbox",
  "attr.power_hp": "Power",
  "attr.ccm": "Displacement",
  "attr.sqm": "Living area",
  "attr.rooms": "Rooms",
  "attr.floor": "Floor",
  "attr.plot_sqm": "Plot",

  "saved.title": "Saved listings",
  "saved.empty": "You haven't saved any listings yet.",
  "saved.needAuth": "Sign in to save listings permanently.",
  "saved.removed": "Removed from favourites",
  "saved.added": "Added to favourites",

  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.push": "Notify me about new matches",
  "settings.pushHint": "Enable push to be notified when new listings match your filters.",
  "settings.saved": "Settings saved",

  "auth.title": "Sign in or register",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.signin": "Sign in",
  "auth.signup": "Register",
  "auth.switchToSignup": "No account yet? Register now",
  "auth.switchToSignin": "Already registered? Sign in",
  "auth.checkEmail": "Please confirm your email address.",
  "auth.welcome": "Welcome back!",

  "footer.info": "Info",
  "footer.support": "Support",
  "footer.imprint": "Legal notice",
  "footer.reviews": "Reviews",
  "footer.invite": "Invite friends",
  "footer.copyright": "All rights reserved © Developer: Berat Konjusha",

  "info.title": "About EuroDeal",
  "info.purposeTitle": "Purpose",
  "info.purpose":
    "EuroDeal brings property, car and motorcycle listings from all over Europe including the Balkans into one place. Instead of raw data, every listing gets a transparent price rating: we compare it to the median of comparable listings and mark it as very cheap, market price or overpriced.",
  "info.devTitle": "Developer",
  "info.dev": "Berat Konjusha",
  "info.dataTitle": "Data sources",
  "info.data":
    "Data comes from official portal APIs and feeds. EuroDeal stores metadata only and always links back to the original listing on the source portal.",

  "support.title": "Contact support",
  "support.intro": "Write to us – we'll get back to you by email.",
  "support.name": "Name",
  "support.email": "Email",
  "support.message": "Message",
  "support.send": "Send message",
  "support.sent": "Thanks! Your message has been sent.",
  "support.error": "Message could not be sent.",

  "imprint.title": "Legal notice",
  "imprint.responsible": "Responsible for content",
  "imprint.contact": "Contact",
  "imprint.disclaimerTitle": "Liability for third-party content",
  "imprint.disclaimer":
    "EuroDeal is an aggregator. All listings originate from the named portals and providers. Only the original providers are liable for accuracy, completeness and timeliness. Price ratings are statistical estimates, not purchase advice.",
  "imprint.privacyTitle": "Privacy",
  "imprint.privacy":
    "We only store what is required to operate the service: account data, favourites, settings and voluntarily submitted support messages and reviews. No tracking cookies are used. Access and deletion requests any time via the contact address.",

  "reviews.title": "Reviews",
  "reviews.intro": "All reviews are publicly visible.",
  "reviews.average": "Average",
  "reviews.count": "{n} reviews",
  "reviews.yourRating": "Your rating",
  "reviews.yourName": "Your name",
  "reviews.yourText": "Your comment (optional)",
  "reviews.submit": "Submit review",
  "reviews.thanks": "Thanks for your review!",
  "reviews.needAuth": "Sign in to leave a review.",
  "reviews.empty": "No reviews yet – be the first!",

  "invite.title": "Invite friends",
  "invite.text": "Share EuroDeal with your friends:",
  "invite.copy": "Copy link",
  "invite.copied": "Link copied",
  "invite.message": "Check out EuroDeal – property & vehicles across Europe with a price check:",

  "common.close": "Close",
  "common.cancel": "Cancel",
  "common.km": "km",
  "common.of": "of",
  "common.error": "Something went wrong.",
};

const sq: Dict = {
  "app.name": "EuroDeal",
  "app.tagline": "Prona, vetura & motoçikleta nga e gjithë Evropa – me vlerësim real të çmimit.",
  "nav.feed": "Kërko",
  "nav.saved": "Të ruajtura",
  "nav.reviews": "Vlerësime",
  "nav.language": "Gjuha",
  "nav.back": "Kthehu",
  "nav.signin": "Kyçu",
  "nav.signout": "Dilni",

  "search.placeholder": "p.sh. shtëpi, BMW, banesë në Tiranë …",
  "search.button": "Kërko",
  "search.running": "Duke kërkuar …",
  "filters.title": "Filtra",
  "filters.category": "Kategoria",
  "filters.all": "Të gjitha",
  "filters.country": "Shteti",
  "filters.anyCountry": "Të gjitha shtetet",
  "filters.city": "Qyteti",
  "filters.anyCity": "Të gjitha qytetet",
  "filters.radius": "Rrezja",
  "filters.noRadius": "Pa rreze",
  "filters.sources": "Burimet",
  "filters.allSources": "Të gjitha burimet",
  "filters.sourcesSelected": "{n} burime të zgjedhura",
  "filters.priceMin": "Çmimi nga",
  "filters.priceMax": "Çmimi deri",
  "filters.reset": "Pastro filtrat",
  "filters.apply": "Apliko",
  "filters.open": "Hap filtrat",

  "cat.all": "Të gjitha",
  "cat.real_estate": "Prona",
  "cat.apartments": "Banesa",
  "cat.cars": "Vetura",
  "cat.motorcycles": "Motoçikleta",

  "sort.label": "Rendit sipas",
  "sort.price_asc": "Çmimi më i ulët",
  "sort.price_desc": "Çmimi më i lartë",
  "sort.newest": "Më të rejat",
  "sort.best_deal": "Vlerësimi më i mirë",

  "results.count": "{n} rezultate",
  "results.none": "Nuk u gjet asnjë shpallje. Ndrysho filtrat.",
  "results.more": "Ngarko më shumë",
  "results.loading": "Duke u ngarkuar …",

  "band.great": "Shumë lirë",
  "band.good": "Çmim i mirë",
  "band.fair": "Çmim tregu",
  "band.high": "I mbiçmuar",
  "band.check": "Kontrollo",
  "band.explain": "Mesatarja {median} nga {n} shpallje të krahasueshme – kjo është {diff} {dir}.",
  "band.above": "më lart",
  "band.below": "më poshtë",
  "band.noData": "Shumë pak shpallje krahasuese për vlerësim.",
  "band.how": "Si llogaritet?",

  "detail.gallery": "Fotot",
  "detail.details": "Detajet",
  "detail.description": "Përshkrimi",
  "detail.original": "Te shpallja origjinale",
  "detail.share": "Ndaj shpalljen",
  "detail.save": "Ruaj",
  "detail.saved": "E ruajtur",
  "detail.marketCheck": "Kontrolli i çmimit",
  "detail.source": "Burimi",
  "detail.posted": "Publikuar",
  "detail.notFound": "Kjo shpallje nuk është më e disponueshme.",
  "detail.copied": "Linku u kopjua",

  "attr.year": "Viti",
  "attr.km": "Kilometrazhi",
  "attr.fuel": "Karburanti",
  "attr.gearbox": "Transmisioni",
  "attr.power_hp": "Fuqia",
  "attr.ccm": "Cilindrata",
  "attr.sqm": "Sipërfaqja",
  "attr.rooms": "Dhoma",
  "attr.floor": "Kati",
  "attr.plot_sqm": "Toka",

  "saved.title": "Shpalljet e ruajtura",
  "saved.empty": "Nuk ke ruajtur ende asnjë shpallje.",
  "saved.needAuth": "Kyçu për t'i ruajtur shpalljet përgjithmonë.",
  "saved.removed": "U hoq nga të preferuarat",
  "saved.added": "U shtua te të preferuarat",

  "settings.title": "Cilësimet",
  "settings.language": "Gjuha",
  "settings.push": "Njoftime për shpallje të reja",
  "settings.pushHint": "Aktivizo njoftimet për t'u informuar kur shpallje të reja përputhen.",
  "settings.saved": "Cilësimet u ruajtën",

  "auth.title": "Kyçu ose regjistrohu",
  "auth.email": "Email",
  "auth.password": "Fjalëkalimi",
  "auth.signin": "Kyçu",
  "auth.signup": "Regjistrohu",
  "auth.switchToSignup": "Nuk ke llogari? Regjistrohu",
  "auth.switchToSignin": "Ke llogari? Kyçu",
  "auth.checkEmail": "Të lutem konfirmo email-in tënd.",
  "auth.welcome": "Mirë se u ktheve!",

  "footer.info": "Info",
  "footer.support": "Mbështetje",
  "footer.imprint": "Impresum",
  "footer.reviews": "Vlerësime",
  "footer.invite": "Fto miqtë",
  "footer.copyright": "Të gjitha të drejtat e rezervuara © Zhvilluesi: Berat Konjusha",

  "info.title": "Rreth EuroDeal",
  "info.purposeTitle": "Qëllimi",
  "info.purpose":
    "EuroDeal mbledh shpallje pronash, veturash dhe motoçikletash nga e gjithë Evropa përfshirë Ballkanin në një vend. Në vend të të dhënave të papërpunuara, çdo shpallje merr një vlerësim të qartë çmimi: e krahasojmë me medianën e shpalljeve të ngjashme dhe e shënojmë si shumë lirë, çmim tregu ose të mbiçmuar.",
  "info.devTitle": "Zhvilluesi",
  "info.dev": "Berat Konjusha",
  "info.dataTitle": "Burimet e të dhënave",
  "info.data":
    "Të dhënat vijnë nga API-t dhe feed-et zyrtare të portaleve. EuroDeal ruan vetëm metadata dhe lidhet gjithmonë me shpalljen origjinale.",

  "support.title": "Kontakto mbështetjen",
  "support.intro": "Na shkruaj – të kthejmë përgjigje me email.",
  "support.name": "Emri",
  "support.email": "Email",
  "support.message": "Mesazhi",
  "support.send": "Dërgo mesazhin",
  "support.sent": "Faleminderit! Mesazhi u dërgua.",
  "support.error": "Mesazhi nuk mund të dërgohej.",

  "imprint.title": "Impresum",
  "imprint.responsible": "Përgjegjës për përmbajtjen",
  "imprint.contact": "Kontakti",
  "imprint.disclaimerTitle": "Përgjegjësia për përmbajtje të palëve të treta",
  "imprint.disclaimer":
    "EuroDeal është agregator. Të gjitha shpalljet vijnë nga portalet e përmendura. Vetëm ofruesit origjinalë janë përgjegjës për saktësinë dhe aktualitetin. Vlerësimet e çmimit janë vlerësime statistikore, jo këshillë blerjeje.",
  "imprint.privacyTitle": "Privatësia",
  "imprint.privacy":
    "Ruajmë vetëm çfarë nevojitet: të dhënat e llogarisë, të preferuarat, cilësimet dhe mesazhet e dërguara vullnetarisht. Nuk përdoren cookie gjurmuese. Qasje dhe fshirje në çdo kohë përmes adresës së kontaktit.",

  "reviews.title": "Vlerësime",
  "reviews.intro": "Të gjitha vlerësimet janë publike.",
  "reviews.average": "Mesatarja",
  "reviews.count": "{n} vlerësime",
  "reviews.yourRating": "Vlerësimi yt",
  "reviews.yourName": "Emri yt",
  "reviews.yourText": "Komenti yt (opsional)",
  "reviews.submit": "Dërgo vlerësimin",
  "reviews.thanks": "Faleminderit për vlerësimin!",
  "reviews.needAuth": "Kyçu për të lënë një vlerësim.",
  "reviews.empty": "Ende pa vlerësime – bëhu i pari!",

  "invite.title": "Fto miqtë",
  "invite.text": "Ndaj EuroDeal me miqtë e tu:",
  "invite.copy": "Kopjo linkun",
  "invite.copied": "Linku u kopjua",
  "invite.message": "Shiko EuroDeal – prona & automjete nga e gjithë Evropa me kontroll çmimi:",

  "common.close": "Mbyll",
  "common.cancel": "Anulo",
  "common.km": "km",
  "common.of": "nga",
  "common.error": "Diçka shkoi keq.",
};

const DICTS: Record<Lang, Dict> = {
  de: { ...de, ...EXTRA_DICTS.de },
  en: { ...en, ...EXTRA_DICTS.en },
  sq: { ...sq, ...EXTRA_DICTS.sq },
};

const STORAGE_KEY = "eurodeal.lang";

function detectLang(): Lang {
  if (typeof navigator === "undefined") return "de";
  const langs = [navigator.language, ...(navigator.languages ?? [])].filter(Boolean);
  for (const l of langs) {
    const code = l.slice(0, 2).toLowerCase();
    if (code === "sq") return "sq";
    if (code === "de") return "de";
    if (code === "en") return "en";
  }
  return "en";
}

type I18nValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("de");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    setLangState(stored && DICTS[stored] ? stored : detectLang());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = DICTS[lang][key] ?? DICTS.en[key] ?? key;
      if (!vars) return raw;
      return Object.entries(vars).reduce(
        (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
        raw,
      );
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
