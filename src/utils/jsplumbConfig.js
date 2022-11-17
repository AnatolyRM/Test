const jspConfig = {
  ConnectionsDetachable: false,
  Connector: [
    'Straight',
    {
      stub: 0,
      gap: 1,
    },
  ],
  ConnectionOverlays: [['Arrow', { location: 1, foldback: 0.5, length: 10, width: 10 }]],
  Container: 'canvas',
  DragOptions: { opacity: 0.5 },
  Endpoint: ['Dot', { radius: 5 }],
  EndpointStyle: {
    stroke: '#7AB02C',
    strokeWidth: 1,
    outlineStroke: '#7AB02C',
    outlineWidth: 1,
  },
  EndpointHoverStyle: { stroke: '#409eff' },

  LabelStyle: { color: 'black' },
  MaxConnections: -1,
  PaintStyle: { strokeWidth: 2, stroke: '#409EFF' },
  HoverPaintStyle: { strokeWidth: 2, stroke: '#00c88d' },

  ReattachConnections: false,
  Scope: 'Test',
};

export default jspConfig;
