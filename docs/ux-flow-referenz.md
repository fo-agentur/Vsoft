# UX-Flow-Referenz: Aufmaß- & Planungs-Apps (Kategorie ViSoft Smart)

**Zweck:** Referenz für das eigene UX-Konzept von Vsoft. Dokumentiert wird
ausschließlich der *Ablauf* (welcher Schritt kommt wann, welche Interaktionen
gibt es) in eigenen Worten – kein Code, keine Bilder, kein Branding, keine
Look-and-feel-Übernahme.

> **Hinweis zur Entstehung:** Der direkte Klick-Durchgang durch die Live-App
> `vismart.visoft.de` war aus dieser Entwicklungsumgebung nicht möglich – die
> Netzwerk-Policy der Cloud-Umgebung blockiert externe Domains (HTTP 403 am
> Proxy, nur Paket-Registries u. Ä. sind freigeschaltet). Der folgende Ablauf
> ist aus öffentlich verfügbaren Produktbeschreibungen und Anleitungen
> rekonstruiert (Quellen unten). Für einen echten Klick-Durchgang müsste die
> Domain in den Netzwerkeinstellungen der Claude-Code-Umgebung freigegeben
> werden (siehe <https://code.claude.com/docs/en/claude-code-on-the-web>) –
> die Erkenntnisse lassen sich dann hier nachtragen.

## 1. Rekonstruierter Ablauf der Referenz-App

Der dokumentierte Kernablauf von ViSoft Smart (Aufmaß-App für
Tablet/Smartphone/Web) besteht aus diesen Phasen:

1. **Start / Projekt**
   - Einstieg über eine Projekt- bzw. Aufmaßliste, neues Aufmaß anlegen.
2. **Raumform wählen**
   - Auswahl einer Standard-Raumform (Rechteck, L-Form, …) als Startpunkt
     **oder** freies Zeichnen eines individuellen Grundrisses.
3. **Aufmaß / Maße erfassen**
   - Wandlängen numerisch eingeben bzw. anpassen; Werte bleiben editierbar.
   - Alternativ Messwert-Übernahme per Bluetooth-Laser-Entfernungsmesser
     (dokumentiert: Leica Disto, Bosch GLM 50/100, Laserliner
     DistanceMaster) direkt in das aktive Maßfeld.
4. **Grundriss verfeinern**
   - Trennwände einziehen.
   - Türen und Fenster auf Wände setzen (Position entlang der Wand + Maße).
5. **2D-Kontrolle**
   - Grundriss mit automatischer Bemaßung prüfen und korrigieren.
6. **Einrichten**
   - Sanitärelemente platzieren (Drag & Drop).
   - Fliesen auf Flächen verlegen (in der Smart-Variante bewusst
     eingeschränkter Umfang, volle Tiefe erst in der Desktop-Software).
7. **3D-Präsentation**
   - Umschalten in eine interaktive 3D-Ansicht, als Gesprächsgrundlage mit
     dem Kunden direkt auf der Baustelle.
8. **Export / Übergabe**
   - Aufmaß per E-Mail versenden, in die Hersteller-Cloud hochladen oder in
     der großen Planungssoftware (Premium) weiterverarbeiten.

**Wesentliche UX-Muster daraus:**

- *Linearer Wizard für den Einstieg* (Raumform → Maße), danach *freier
  Editor* – die Reihenfolge ist Empfehlung, kein Zwang.
- *Ein Raum ist die zentrale Arbeitseinheit*, Projekte klammern Räume.
- *Jedes Maß bleibt jederzeit editierbar* – Aufmaß ist ein lebendes Dokument,
  kein einmaliger Import.
- *2D und 3D sind zwei Sichten auf dasselbe Modell*, umschaltbar ohne
  Datenverlust.
- *Mobile-first-Bedienung*: große Touch-Ziele, wenige Werkzeuge gleichzeitig
  sichtbar.

## 2. Abgeleitetes Screen-Konzept für Vsoft (eigenes Konzept)

Daraus leiten wir für Vsoft folgende Screens und Navigationsstruktur ab –
bewusst um die Punkte erweitert, die uns wichtig sind (Kundenbezug,
Angebot/PDF, Sharing):

```
Dashboard (Projekte, Suche, Kunde)
└── Projekt (Stammdaten, Kunde, Räume, Angebot)
    └── Raum-Editor  ← zentrale Arbeitsfläche, Modus-Tabs:
        ├── [Aufmaß/2D]  Raumform-Vorlagen, Wände zeichnen/ziehen,
        │                Türen/Fenster/Nischen, Live-Bemaßung, Maßeingabe
        ├── [3D]         gleiche Daten als 3D-Raum, Orbit-/Walk-Kamera
        ├── [Belegung]   Katalog-Seitenleiste (Fliesen/Sanitär),
        │                Drag & Drop auf Flächen, Verlegemuster, Fugen
        └── [Angebot]    Stückliste (m², Stück), Preise, PDF-Export,
                         Read-only-Share-Link
Katalog (eigenständiger Bereich: Fliesen & Sanitär CRUD, Uploads)
```

**Neuer Raum als 3-Schritte-Wizard:**

1. Raumform wählen (Rechteck / L-Form / frei zeichnen)
2. Maße eintragen (pro Wand, Raumhöhe; später: Laser/AR als Eingabequelle)
3. Öffnungen setzen (Tür/Fenster/Nische auf Wand mit Offset + Maßen)

Danach landet man im freien Editor (Modus „Aufmaß/2D“).

**Interaktionsregeln (für die späteren Schritte 3–6):**

- Maßzahlen im 2D-Editor sind klickbar und direkt editierbar (Inline-Input);
  Änderung eines Maßes verschiebt die abhängige Geometrie.
- Flächen (Boden, Decke, einzelne Wände) sind selektierbar; eine Auswahl
  bestimmt, worauf ein Katalog-Drop wirkt.
- Verlegemuster, Fugenbreite und Fugenfarbe sind Eigenschaften der
  *Platzierung* (nicht der Fliese), damit dieselbe Fliese je Fläche anders
  verlegt werden kann.
- 2D ↔ 3D ist verlustfrei und jederzeit umschaltbar; 3D dient primär der
  Präsentation, editiert wird vor allem in 2D.

## Quellen (nur Ablaufbeschreibungen, öffentlich)

- Herstellerseite ViSoft Smart (Funktionsübersicht):
  <https://www.visoftgmbh.de/loesungen/visoft-smart/>
- Händlerbeschreibung mit Ablauf (Raumform → Trennwände/Türen/Fenster →
  Sanitär/Fliesen → 3D): <https://www.ceramic-stone.de/visoft-smart/>
- Laser-Import per Bluetooth (Leica/Bosch/Laserliner):
  <https://www.1200grad.com/visoft-smart-fuer-tablet-smartphone-laser-aufmass-per-bluetooth-importieren>
  und <https://www.haustec.de/sanitaer/bad-design/app-visoft-smart-importiert-aufmass-daten-bluetooth>
- App-Store-Beschreibungen (Feature-Liste, 2D/3D, Export):
  <https://apps.apple.com/de/app/visoft-smart/id1051333790>,
  <https://play.google.com/store/apps/details?id=com.visoft.vimeasure>
