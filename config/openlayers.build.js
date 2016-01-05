{
  "exports": [
    "ol.Attribution",
    "ol.Attribution#*",
    "ol.Collection",
    "ol.Collection#*",
    "ol.Feature",
    "ol.Feature#*",
    "ol.Map",
    "ol.Map#*",
    "ol.Overlay",
    "ol.Overlay#*",
    "ol.View",
    "ol.View#*",
    "ol.control.Attribution",
    "ol.control.Attribution#*",
    "ol.control.Control",
    "ol.control.Control#*",
    "ol.control.defaults",
    "ol.control.MousePosition",
    "ol.control.MousePosition#*",
    "ol.control.Rotate",
    "ol.control.Rotate#*",
    "ol.control.ScaleLine",
    "ol.control.ScaleLine#*",
    "ol.control.Zoom",
    "ol.control.Zoom#*",
    "ol.control.ZoomSlider",
    "ol.control.ZoomSlider#*",
    "ol.extent.containsCoordinate",
    "ol.extent.intersects",
    "ol.extent.getTopLeft",
    "ol.format.GeoJSON",
    "ol.format.GeoJSON#*",
    "ol.geom.Point",
    "ol.geom.Point#*",
    "ol.geom.Polygon",
    "ol.geom.Polygon#*",
    "ol.geom.SimpleGeometry#getExtent",
    "ol.interaction.defaults",
    "ol.interaction.Modify",
    "ol.interaction.Modify#*",
    "ol.layer.Image",
    "ol.layer.Image#*",
    "ol.layer.Tile",
    "ol.layer.Tile#*",
    "ol.layer.Vector",
    "ol.layer.Vector#*",
    "ol.loadingstrategy.bbox",
    "ol.proj.addProjection",
    "ol.proj.Projection",
    "ol.proj.Projection#getCode",
    "ol.proj.Projection#getExtent",
    "ol.proj.Projection#getMetersPerUnit",
    "ol.proj.transform",
    "ol.source.GeoJSON",
    "ol.source.GeoJSON#*",
    "ol.source.ImageWMS",
    "ol.source.ImageWMS#*",
    "ol.source.ServerVector",
    "ol.source.ServerVector#*",
    "ol.source.TileImage",
    "ol.source.TileImage#*",
    "ol.source.WMTS",
    "ol.source.WMTS#*",
    "ol.source.Vector",
    "ol.source.Vector#*",
    "ol.style.Circle",
    "ol.style.Circle#*",
    "ol.style.Fill",
    "ol.style.Fill#*",
    "ol.style.Icon",
    "ol.style.Icon#*",
    "ol.style.Stroke",
    "ol.style.Stroke#*",
    "ol.style.Style",
    "ol.style.Style#*",
    "ol.tilegrid.TileGrid",
    "ol.tilegrid.TileGrid#*",
    "ol.tilegrid.WMTS",
    "ol.tilegrid.WMTS#*"
  ],
  "compile": {
    "externs": [
      "externs/geojson.js",
      "externs/oli.js",
      "externs/olx.js",
      "externs/proj4js.js"
    ],
    "define": [
      "goog.dom.ASSUME_STANDARDS_MODE=true",
      "goog.DEBUG=false"
    ],
    "compilation_level": "ADVANCED",
    "output_wrapper": "(function(){%output%})();",
    "use_types_for_optimization": true,
    "manage_closure_dependencies": true
  }
}