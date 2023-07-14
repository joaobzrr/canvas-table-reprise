import Konva from "konva";
import { Component, ComponentConfig } from "./Component";
import { TableState } from "./TableState";

export interface HorizontalScrollbarConfig extends ComponentConfig {
  tableState: TableState;
}

export class HorizontalScrollbar extends Component {
  tableState: TableState;

  bar: Konva.Rect;
  track: Konva.Rect;
  thumb: Konva.Rect;

  constructor(config: HorizontalScrollbarConfig) {
    super(config);

    this.tableState = config.tableState;

    this.bar = new Konva.Rect({
      fill: "green",
      strokeWidth: 1
    });
    this.add(this.bar);

    this.track = new Konva.Rect();
    this.add(this.track);

    this.thumb = new Konva.Rect({ fill: "red" });
    this.add(this.thumb);
  }

  onResize() {
    this.render();
  }

  onWheel() {
    this.render();
  }

  render() {
    const { x: viewportWidth } = this.tableState.viewportDimensions;
    const { x: scrollWidth } = this.tableState.scrollDimensions;

    const { theme } = this.tableState;
    const barHeight = theme.scrollBarThickness;

    const barWidth = this.width();

    this.bar.setAttrs({
      x: 0,
      y: 0,
      width: barWidth,
      height: barHeight
    });

    const trackX = theme.scrollBarTrackMargin; 
    const trackY = theme.scrollBarTrackMargin;
    const trackWidth = barWidth - (theme.scrollBarTrackMargin * 2);
    const trackHeight = barHeight - (theme.scrollBarTrackMargin * 2);

    this.track.setAttrs({
      x: trackX,
      y: trackY,
      width: trackWidth,
      height: trackHeight
    });

    this.thumb.setAttrs({
      x: trackX,
      y: trackY,
      width: (viewportWidth / scrollWidth) * trackWidth,
      height: trackHeight
    });
  }
}
