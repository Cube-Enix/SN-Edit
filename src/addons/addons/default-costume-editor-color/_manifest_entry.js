/* generated by pull.js */
const manifest = {
  "editorOnly": true,
  "noTranslations": true,
  "name": "Customizable default costume editor colors",
  "description": "Changes the default colors and outline size used by the costume editor.",
  "credits": [
    {
      "name": "GarboMuffin"
    }
  ],
  "userscripts": [
    {
      "url": "userscript.js"
    }
  ],
  "settings": [
    {
      "dynamic": true,
      "name": "Default fill color",
      "id": "fill",
      "type": "color",
      "default": "#f7aa32"
    },
    {
      "dynamic": true,
      "name": "Default outline color",
      "id": "stroke",
      "type": "color",
      "default": "#000000"
    },
    {
      "dynamic": true,
      "name": "Default outline size",
      "id": "strokeSize",
      "type": "integer",
      "min": 0,
      "max": 100,
      "default": 5
    },
    {
      "dynamic": true,
      "name": "Use previous color instead of default when switching tools",
      "id": "persistence",
      "type": "boolean",
      "default": true
    }
  ],
  "tags": [
    "beta",
    "new"
  ],
  "dynamicDisable": true,
  "enabledByDefault": true
};
export default manifest;
